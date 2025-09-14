const fs = require('fs');
const path = require('path');
const express = require('express');

/**
 * Mount an exported Next.js static site located in dataDir/out onto the provided express app.
 * Returns true if mounted, false otherwise.
 */
module.exports = function mountExportedFrontend(app, dataDir) {
  try {
    const exportedFrontend = path.join(dataDir, 'out');
    if (!fs.existsSync(exportedFrontend) || !fs.statSync(exportedFrontend).isDirectory()) return false;
    console.log('Serving exported frontend from', exportedFrontend);

    // Note: we intentionally do NOT serve index.html to avoid exposing
    // the full heavy frontend. The PWA entry (`pwa.html`) is mapped below
    // and is the only HTML entrypoint served at `/`.

    const sendIfExists = (rel) => {
      const p = path.join(exportedFrontend, rel);
      if (fs.existsSync(p)) {
        // normalize to forward-slash route
        const route = '/' + rel.replace(/\\/g, '/');
        app.get(route, (req, res) => res.sendFile(p));
      }
    };

    ['sw.js', 'manifest.json', 'favicon.ico'].forEach(sendIfExists);

    const iconsDir = path.join(exportedFrontend, 'icons');
    if (fs.existsSync(iconsDir) && fs.statSync(iconsDir).isDirectory()) {
      app.use('/icons', express.static(iconsDir, { maxAge: '1h' }));
    }

    const nextDir = path.join(exportedFrontend, '_next');
    if (fs.existsSync(nextDir) && fs.statSync(nextDir).isDirectory()) {
      app.use('/_next', express.static(nextDir, { maxAge: '1h' }));
    }

    // Serve only the PWA entry to keep the frontend lightweight for mobile.
    // Map `/` -> pwa.html (if present) and `/pwa/*` -> files under out/pwa.
    const pwaHtml = path.join(exportedFrontend, 'pwa.html');
    if (fs.existsSync(pwaHtml)) {
      // Serve pwa.html but inject a small script to rewrite http:// absolute requests to use the
      // current page protocol (https when the site is served over HTTPS). This avoids mixed
      // content errors when the static export contains hard-coded http:// API endpoints.
      const injectScript = `\n<script>\n(function(){\n  try{\n    const originalFetch = window.fetch.bind(window);\n    window.fetch = function(input, init){\n      try{\n        if (typeof input === 'string' && input.indexOf('http://') === 0) {\n          input = input.replace(/^http:\\/\\//, window.location.protocol + '//');\n        } else if (input && input.url && typeof input.url === 'string' && input.url.indexOf('http://') === 0) {\n          input = new Request(input.url.replace(/^http:\\/\\//, window.location.protocol + '//'), input);\n        }\n      }catch(e){}\n      return originalFetch(input, init);\n    };\n    const origOpen = XMLHttpRequest.prototype.open;\n    XMLHttpRequest.prototype.open = function(method, url){\n      try{\n        if (typeof url === 'string' && url.indexOf('http://') === 0) {\n          url = url.replace(/^http:\\/\\//, window.location.protocol + '//');\n        }\n      }catch(e){}\n      return origOpen.apply(this, arguments);\n    };\n  }catch(e){}\n})();\n</script>\n`;

      const sendPwaWithInjection = (req, res) => {
        try {
          let html = fs.readFileSync(pwaHtml, 'utf8');
          // Try to inject before </head> if present, otherwise prepend
          if (html.indexOf('</head>') !== -1) {
            html = html.replace('</head>', injectScript + '</head>');
          } else {
            html = injectScript + html;
          }
          res.setHeader('Content-Type', 'text/html');
          return res.send(html);
        } catch (err) {
          // fallback to sending file directly on error
          return res.sendFile(pwaHtml);
        }
      };

      app.get('/', sendPwaWithInjection);
      app.get('/pwa.html', sendPwaWithInjection);
    }

    const pwaDir = path.join(exportedFrontend, 'pwa');
    if (fs.existsSync(pwaDir) && fs.statSync(pwaDir).isDirectory()) {
      app.use('/pwa', express.static(pwaDir, { maxAge: '1h' }));
    }

    return true;
  } catch (err) {
    console.error('Failed to mount exported frontend:', err && err.message);
    if (err && err.stack) console.error(err.stack);
    return false;
  }
};
