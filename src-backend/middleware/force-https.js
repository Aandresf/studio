function getFullUrl(req) {
    return `${req.protocol}://${req.get('host')}${req.originalUrl}`;
}

module.exports = function forceHttps(options = {}) {
    const { allowLocal = true } = options;

    return (req, res, next) => {
        // Si ya es HTTPS, solo actualizar CSP
        if (req.secure) {
            // Configurar CSP para forzar HTTPS
            res.setHeader('Content-Security-Policy', `
                default-src 'self' https: 'unsafe-inline' 'unsafe-eval';
                img-src 'self' https: data: blob:;
                font-src 'self' https: data:;
                object-src 'none';
                upgrade-insecure-requests;
            `.replace(/\s+/g, ' ').trim());
            
            return next();
        }

        // Permitir HTTP solo para localhost si allowLocal es true
        const host = req.get('host');
        if (allowLocal && (host.includes('localhost') || host.includes('127.0.0.1'))) {
            return next();
        }

        // Redirigir a HTTPS
        const httpsUrl = 'https://' + req.get('host') + req.originalUrl;
        res.redirect(301, httpsUrl);
    };
};