PWA integration notes

This project was prepared to support PWA via `next-pwa`.

Steps to enable PWA locally:

1. Install the package:

```bash
# from project root
npm install next-pwa workbox-core workbox-precaching workbox-routing workbox-strategies --save
```

2. Build or run in production mode (service worker disabled in development by default):

```bash
npm run build
npm run start
```

3. Verify `manifest.json` is served at `http://localhost:3000/manifest.json` and the service worker is registered in production.

Notes:
- `next.config.ts` attempts to require `next-pwa`. If not installed, the project will keep working normally but without PWA features.
- Icons are in `public/icons/`.
- Theme color is set to `#7C3AED` (purple accent). Background is white.

Testing on device:
- Serve the production build over HTTPS (or use `localhost` with a tunnel) to test installability on mobile.

Windows (cmd.exe) quick commands:

```cmd
cd %USERPROFILE%\path\to\studio
npm install next-pwa workbox-core workbox-precaching workbox-routing workbox-strategies --save
npm run build
npm run start
```

Notes about development:
- Service worker is disabled in development by default in the `next-pwa` config inside `next.config.ts`.
- If you need to enable it in development for testing, set `process.env.NODE_ENV=production` when running.

If you want, I can add automated icons generation, offline caching strategies, or custom service worker logic.
