# Pruebas de Integración Frontend-Backend

## Endpoints Críticos para Probar

### 1. Autenticación
```bash
# Test auth/status (el que usaba antes)
curl -X GET http://localhost:3001/api/auth/status

# Test auth/me (nuevo alias para frontend)
curl -X GET http://localhost:3001/api/auth/me
```

### 2. Productos
```bash
# Listar productos
curl -X GET http://localhost:3001/api/products

# Crear producto (necesita auth)
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Producto Test","description":"Test","base_price":100.0,"brand_id":1,"subdepartment_id":1}'
```

### 3. Variantes (crítico - antes daba 404)
```bash
# Listar variantes
curl -X GET http://localhost:3001/api/variants

# Listar variantes por producto
curl -X GET "http://localhost:3001/api/variants?product_id=1"
```

### 4. Brands (antes no funcionaba)
```bash
# Listar marcas
curl -X GET http://localhost:3001/api/brands
```

### 5. Departments/Subdepartments (nuevo)
```bash
# Listar departamentos
curl -X GET http://localhost:3001/api/departments

# Listar subdepartamentos directamente (nueva ruta)
curl -X GET http://localhost:3001/api/subdepartments
```

### 6. Dashboard (nuevo)
```bash
# Dashboard summary (lo que espera el frontend)
curl -X GET http://localhost:3001/api/dashboard/summary

# Recent sales (nuevo)
curl -X GET http://localhost:3001/api/dashboard/recent-sales
```

### 7. Inventory snapshots (nuevo)
```bash
# Latest snapshot
curl -X GET http://localhost:3001/api/inventory/latest-snapshot

# Create snapshot
curl -X POST http://localhost:3001/api/inventory/create-snapshot \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Snapshot"}'
```

### 8. Reports (nuevo)
```bash
# Listar reportes disponibles
curl -X GET http://localhost:3001/api/reports

# Generar reporte de inventario
curl -X GET http://localhost:3001/api/reports/inventory
```

### 9. Store Settings (nuevo)
```bash
# Obtener configuraciones de tienda
curl -X GET http://localhost:3001/api/settings/store
```

### 10. Sales/Purchases details (nuevo)
```bash
# Detalles de venta
curl -X GET "http://localhost:3001/api/sales/details?id=S001"

# Detalles de compra  
curl -X GET "http://localhost:3001/api/purchases/details?id=P001"
```

## Resultados Esperados

✅ **200 OK** - Endpoint funciona correctamente
❌ **404 Not Found** - Endpoint no implementado
🔧 **500 Internal Server Error** - Error en implementación
⚠️ **403 Forbidden** - Problema de autenticación/permisos

## Pruebas Prioritarias

1. **GET /api/variants** - Verificar que ya no da 404
2. **GET /api/auth/me** - Nuevo alias para frontend
3. **GET /api/dashboard/summary** - Dashboard funcional
4. **GET /api/departments** - Departamentos funcionando
5. **GET /api/subdepartments** - Nueva ruta directa
6. **GET /api/settings/store** - Configuraciones de tienda