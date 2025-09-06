Servidor en LAN

Objetivo: permitir que el backend escuche peticiones desde toda la red local.

Cambios realizados
- `src-backend/index.js` ahora usa las variables de entorno `PORT` y `API_HOST`/`HOST`. Por defecto escucha en `0.0.0.0`.
- El log muestra la IP local detectada cuando se enlaza a `0.0.0.0`.

Cómo ejecutar
1. Desde la máquina que corre el backend (Windows), exporta variables de entorno en cmd.exe: 

```cmd
set PORT=3001
set API_HOST=0.0.0.0
node src-backend/index.js
```

2. Si quieres iniciar desde npm (si hay un script que arranque el backend directo), puedes usar `cross-env` (ya en devDependencies) o setear variables antes de la ejecución:

```cmd
set PORT=3001 && set API_HOST=0.0.0.0 && npm run start-backend
```

Nota: el proyecto no incluye un script `start-backend` por defecto; ejecutar `node src-backend/index.js` es suficiente.

Configurar el frontend para usar la IP del servidor
- En el cliente, `src/lib/api.ts` ya usa `NEXT_PUBLIC_API_URL` para apuntar al backend. Para que la app frontend (cuando se sirve desde otra máquina) haga requests a `http://<IP_DEL_SERVIDOR>:3001/api`, establece la variable antes de construir/ejecutar:

```cmd
set NEXT_PUBLIC_API_URL=http://192.168.1.42:3001
npm run dev
```

Seguridad y firewall
- Asegúrate de abrir el puerto en el firewall de Windows o desactivar temporalmente para pruebas.
- Esto expone el API en la red local; no lo uses en redes no confiables sin TLS/Firewall.

Siguientes pasos recomendados
- Añadir un script npm `start-backend` que haga `node src-backend/index.js`.
- Proveer instrucciones para producción con un proxy TLS (nginx) y habilitar CORS de forma segura.
