
---------- ERRORES FRONTEND 


---------- ERRORES BACKEND 

Cannot read properties of undefined (reading 'lastID')

Backend server listening on http://localhost:3001
No hay tienda activa. Esperando la creación de la primera tienda desde la interfaz.
Error fetching dashboard summary: Error: No hay una tienda activa seleccionada.
    at Object.getActiveDb (C:\snapshot\studio\src-backend\database-manager.js:53:15)
    at C:\snapshot\studio\src-backend\index.js:1268:36
    at Layer.handleRequest (C:\snapshot\studio\src-backend\node_modules\router\lib\layer.js:152:17)
    at next (C:\snapshot\studio\src-backend\node_modules\router\lib\route.js:157:13)
    at Route.dispatch (C:\snapshot\studio\src-backend\node_modules\router\lib\route.js:117:3)
    at handle (C:\snapshot\studio\src-backend\node_modules\router\index.js:435:11)
    at Layer.handleRequest (C:\snapshot\studio\src-backend\node_modules\router\lib\layer.js:152:17)
    at C:\snapshot\studio\src-backend\node_modules\router\index.js:295:15
    at processParams (C:\snapshot\studio\src-backend\node_modules\router\index.js:582:12)
    at next (C:\snapshot\studio\src-backend\node_modules\router\index.js:291:5)
    at urlencodedParser (C:\snapshot\studio\src-backend\node_modules\body-parser\lib\types\urlencoded.js:68:7)
    at Layer.handleRequest (C:\snapshot\studio\src-backend\node_modules\router\lib\layer.js:152:17)
    at trimPrefix (C:\snapshot\studio\src-backend\node_modules\router\index.js:342:13)
    at C:\snapshot\studio\src-backend\node_modules\router\index.js:297:9
    at processParams (C:\snapshot\studio\src-backend\node_modules\router\index.js:582:12)
    at next (C:\snapshot\studio\src-backend\node_modules\router\index.js:291:5)
[Debug] Endpoint POST /api/stores alcanzado.
[Debug] Nueva tienda: ID=ak_el_reino_2ASD, Path=C:\PROGRAMACION\INVENTARIO\studio\PORTABLE_RELEASE_v2\app\data\database_ak_el_reino_2ASD.db
[Debug] Iniciando la creación de la base de datos...
[Debug] Archivo .db creado. Ejecutando esquema...
[Debug] Esquema ejecutado. Cerrando nueva BD...
[Debug] Nueva BD cerrada exitosamente.
[Debug] Añadiendo nueva tienda a la configuración...
[Debug] Tienda añadida. Enviando respuesta 201.
Tienda activa cambiada a: ak_el_reino_2ASD
Conexión establecida con la base de datos: Ak El Reino (C:\PROGRAMACION\INVENTARIO\studio\PORTABLE_RELEASE_v2\app\data\database_ak_el_reino_2ASD.db)
--- INICIO DE PETICIÓN GET /api/products ---
--- INICIO DE PETICIÓN GET /api/products ---
--- INICIO DE PETICIÓN GET /api/products ---
--- INICIO DE PETICIÓN GET /api/products ---
--- INICIO DE PETICIÓN GET /api/products ---
--- INICIO DE PETICIÓN GET /api/products ---
--- INICIO DE PETICIÓN GET /api/products ---
--- INICIO DE PETICIÓN GET /api/products ---
--- INICIO DE PETICIÓN GET /api/products ---
--- INICIO DE PETICIÓN POST /api/purchases (NUEVA LÓGICA) ---
Cuerpo de la petición: {
  "transaction_date": "2025-07-15T01:56:32.269Z",
  "entity_name": "Aarnadlo",
  "entity_document": "27747762",
  "items": [
    {
      "productId": 2,
      "quantity": 1,
      "unitCost": 1000
    }
  ]
}
Error durante la transacción de compra: db is not defined
Fatal: No se pudo revertir la transacción [Error: SQLITE_ERROR: cannot rollback - no transaction is active] {
  errno: 1,
  code: 'SQLITE_ERROR'
}
--- INICIO DE PETICIÓN GET /api/products ---
