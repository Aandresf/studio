Start production helper
=======================

Purpose
-------
Helper script to prepare environment variables and start the app in production for quick testing.

Usage (example):

```cmd
node scripts\start-production.js 192.168.0.6
```

Behavior
--------
- Writes `src-backend/data/.env` with `BIND_IP=<ip>` so the backend can bind to that IP.
- Writes `.env.production` with `NEXT_PUBLIC_API_URL=http://<ip>:3001` so the frontend build will reference the backend URL.
- Runs `npm run compile:frontend` (next build) to bake env into the static build.
- Starts backend (`npm run start-backend`) and frontend (`npm run start`).

Warnings
--------
- This script is intended for simple testing. In production, use a process manager (systemd, pm2, docker, etc.) to manage services.
- If the specified IP does not exist on the server, the backend will likely fail to bind. The script does not validate the IP presence on the host network interfaces.
