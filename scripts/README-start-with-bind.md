Start with bind helper
======================

Purpose
-------
Small helper to start both backend and frontend bound to a chosen IP (useful for local LAN/dev on a specific interface).

Usage
-----
From repository root (Windows cmd.exe):

```cmd
node scripts\start-with-bind.js 192.168.0.6
```

The script will:
- write `src-backend/data/.env` with `BIND_IP=<ip>`
- start the backend (`node src-backend/index.js`) with `BIND_IP` in its env
- start the frontend dev (`npm run dev`) with `HOST=<ip>` and `NEXT_PUBLIC_API_URL=http://<ip>:3001`

Notes
-----
- The backend must be configured to read `BIND_IP` from environment or from the `src-backend/data/.env` file on startup. The project already contains an endpoint to persist bind ip; this script simply writes the `.env` and starts processes with the env set.
- In production you should adapt this to your PM2/systemd/docker configuration.
