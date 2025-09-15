// Inyectar en el frontend antes de cualquier fetch
(function secureAllRequests() {
    // Guardar la función fetch original
    const originalFetch = window.fetch;

    // Reemplazar fetch con nuestra versión segura
    window.fetch = function secureFetch(url, options = {}) {
        // Si es una URL absoluta y es HTTP, convertirla a HTTPS
        if (typeof url === 'string' && url.startsWith('http://') && !url.includes('/temp/')) {
            url = url.replace('http://', 'https://');
        }
        return originalFetch(url, options);
    };

    // También asegurar XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        if (typeof url === 'string' && url.startsWith('http://') && !url.includes('/temp/')) {
            url = url.replace('http://', 'https://');
        }
        return originalXHROpen.call(this, method, url, async, user, password);
    };
})();