// Inyectar esto en el service worker (sw.js)
self.addEventListener('fetch', event => {
    // Si la petición ya es HTTPS, no hacer nada
    if (event.request.url.startsWith('https://')) {
        return;
    }

    // Si la petición es HTTP y no es a /temp, convertirla a HTTPS
    if (event.request.url.startsWith('http://') && !event.request.url.includes('/temp/')) {
        const secureUrl = event.request.url.replace('http://', 'https://');
        event.respondWith(
            fetch(secureUrl, {
                method: event.request.method,
                headers: event.request.headers,
                body: event.request.body,
                mode: event.request.mode,
                credentials: event.request.credentials,
                redirect: event.request.redirect
            })
        );
    }
});