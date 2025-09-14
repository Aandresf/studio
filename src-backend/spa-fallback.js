const fs = require('fs');
const path = require('path');

/**
 * Mount a safe SPA fallback middleware.
 * It will serve index.html for GET requests that accept HTML and
 * that are not API or static asset requests.
 */
module.exports = function mountSpaFallback(app, dataDir) {
  try {
    const exportedFrontend = path.join(dataDir, 'out');
    const indexPath = path.join(exportedFrontend, 'index.html');
    if (!fs.existsSync(indexPath)) return false;

    // List of prefixes to ignore (APIs and known asset mounts)
    const ignorePrefixes = ['/api/', '/_next/', '/icons/', '/icons', '/static/'];
    const assetExtRegex = /\.(js|css|png|jpg|jpeg|svg|ico|map|json|woff2?|ttf|eot)$/i;

    // Use app.use with a function (no path string) to avoid path-to-regexp parsing.
    app.use((req, res, next) => {
      try {
        if (!req || !req.method) return next();
        if (req.method.toUpperCase() !== 'GET') return next();

        const urlPath = req.path || req.url || '/';
        const accepts = req.headers && req.headers.accept ? String(req.headers.accept) : '';
  // Lightweight log to help diagnose skipping
  // (will show up in server stdout)
  console.log && console.log(`[spa-fallback] request ${req.method} ${urlPath} accept=${accepts}`);

        // Skip known prefixes
        for (const p of ignorePrefixes) {
          if (urlPath.startsWith(p)) {
            console.log && console.log(`[spa-fallback] skipping because prefix match ${p}`);
            return next();
          }
        }

        // If the path looks like a file (has extension), skip
        if (assetExtRegex.test(urlPath)) {
          console.log && console.log(`[spa-fallback] skipping because looks like asset: ${urlPath}`);
          return next();
        }

        // Only handle requests that accept HTML
        if (!accepts.includes('text/html') && !accepts.includes('*/*')) {
          console.log && console.log(`[spa-fallback] skipping because Accept header not HTML: ${accepts}`);
          return next();
        }

        // Serve the SPA index
  console.log && console.log(`[spa-fallback] serving index for ${urlPath}`);
        return res.sendFile(indexPath);
      } catch (err) {
        // Don't let any error break the server; fallback to next middleware
        console.error && console.error('spa-fallback error', err && err.message);
        return next();
      }
    });

    return true;
  } catch (err) {
    console.error('Failed to mount SPA fallback:', err && err.message);
    if (err && err.stack) console.error(err.stack);
    return false;
  }
};
