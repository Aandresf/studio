# Análisis de Discrepancias: Documentación vs Implementación

## Resumen Ejecutivo

Este análisis compara la documentación existente en `src-backend-rust/endpoints.md` con la implementación real encontrada en el código fuente.

## ✅ ENDPOINTS CORRECTAMENTE DOCUMENTADOS E IMPLEMENTADOS

### 1. Autenticación (/api/auth)
**Documentado**: ✅ POST /login, POST /logout, GET /verify  
**Implementado**: ✅ POST /login, POST /logout, POST /verify, GET /status  
**Discrepancia**: `GET /verify` documentado como GET pero implementado como POST, falta `GET /status` en documentación

### 2. Productos (/api/products)  
**Documentado**: ✅ CRUD básico + search  
**Implementado**: ✅ CRUD + `/count`, `/by-brand/{id}`, `/by-subdepartment/{id}`  
**Discrepancia**: Faltan endpoints específicos en documentación

### 3. Variantes (/api/variants)
**Documentado**: ✅ CRUD básico  
**Implementado**: ✅ CRUD + `/{id}/movements`  
**Discrepancia**: Falta endpoint de movements en documentación

### 4. Ventas (/api/sales)
**Documentado**: ✅ CRUD + annul  
**Implementado**: ✅ Coincide completamente

### 5. Clientes (/api/customers) y Proveedores (/api/suppliers)
**Documentado**: ✅ CRUD + search  
**Implementado**: ✅ Estructura similar con `/count`

## ❌ ENDPOINTS IMPLEMENTADOS PERO NO DOCUMENTADOS

### 1. Estadísticas (/api/stats)
**Implementado pero NO documentado**:
- GET /api/stats/sales
- GET /api/stats/products  
- GET /api/stats/inventory
- GET /api/stats/customers
- GET /api/stats/profit
- GET /api/stats/trends

### 2. Snapshots (/api/snapshots)  
**Implementado pero NO documentado**:
- GET /api/snapshots
- POST /api/snapshots
- GET /api/snapshots/{id}
- DELETE /api/snapshots/{id}
- GET /api/snapshots/{id}/compare/{target_id}
- POST /api/snapshots/{id}/restore

### 3. SKU (/api/sku)
**Implementado pero NO documentado**:
- GET /api/sku/next
- GET /api/sku/preview

### 4. Transacciones Pendientes (/api/pending-transactions)
**Implementado pero NO documentado**:
- GET /api/pending-transactions
- POST /api/pending-transactions  
- DELETE /api/pending-transactions/{id}

### 5. Usuarios (/api/users)
**Implementado pero parcialmente documentado**:
- Implementado: CRUD completo + `/count`
- Documentado: Solo mencionado en tabla de contenidos

## ❌ ENDPOINTS DOCUMENTADOS PERO NO IMPLEMENTADOS

### 1. Dashboard (/api/dashboard)
**Documentado pero NO encontrado en implementación**:
- GET /api/dashboard
- GET /api/dashboard/sales-summary
- GET /api/dashboard/top-products
- GET /api/dashboard/stock-alerts
- GET /api/dashboard/revenue-chart

### 2. Administración (/api/admin)
**Documentado pero NO encontrado**:
- POST /api/admin/backup
- POST /api/admin/restore
- GET /api/admin/system-info
- POST /api/admin/cleanup
- GET /api/admin/check-integrity
- GET /api/admin/log

### 3. Departamentos (/api/departments)
**Documentado pero NO encontrado**:
- CRUD completo para departments
- CRUD para subdepartments
- Endpoints de búsqueda

### 4. Marcas (/api/brands)
**Documentado pero NO encontrado**:
- CRUD completo para brands
- Endpoints de búsqueda

### 5. Atributos (/api/attributes)
**Documentado pero NO encontrado**:
- CRUD para attributes
- CRUD para attribute values

### 6. Inventario (/api/inventory)
**Documentado pero NO encontrado**:
- GET /api/inventory/movements
- POST /api/inventory/movement
- GET /api/inventory/stock-alerts
- GET /api/inventory/valuation

### 7. Compras (/api/purchases)
**Documentado pero NO encontrado**:
- CRUD completo para purchases
- Endpoint de anulación

### 8. Reportes (/api/reports)
**Documentado extensivamente pero NO encontrado en implementación**

## 🔧 DISCREPANCIAS EN FORMATO DE DATOS

### 1. Variantes - Estructura de Campos
**Documentado**:
```json
{
  "product_id": 1,
  "sku": "VES-001-R-M", 
  "price": 150.00,
  "stock": 10
}
```

**Implementado en structs**:
```rust
struct ProductVariant {
    sale_price: f64,    // no "price"
    cost_price: f64,    // no "cost" 
    current_stock: i32  // no "stock"
}
```

### 2. Autenticación - Endpoint verify
**Documentado**: GET /api/auth/verify  
**Implementado**: POST /api/auth/verify

## 📊 ANÁLISIS DE COBERTURA

### Endpoints Documentados: ~40
### Endpoints Implementados: ~35  
### Coincidencias Exactas: ~15 (37.5%)
### Solo Documentado: ~25 (62.5%)
### Solo Implementado: ~20 (57.1%)

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

1. **Documentación Desactualizada**: Muchos endpoints documentados no existen
2. **Funcionalidad Oculta**: Endpoints importantes (stats, snapshots) sin documentar
3. **Inconsistencia en Naming**: price vs sale_price, stock vs current_stock
4. **Métodos HTTP Incorrectos**: GET vs POST en /auth/verify
5. **Arquitectura Fragmentada**: Frontend usa solo subset de endpoints documentados

## 🎯 RECOMENDACIONES PRIORITARIAS

### 1. Actualización Inmediata de Documentación
- Eliminar endpoints no implementados de endpoints.md
- Documentar todos los endpoints realmente implementados
- Corregir métodos HTTP y formatos de datos

### 2. Implementación de Endpoints Faltantes  
- Priorizar dashboard endpoints (críticos para UI)
- Implementar departments/brands (referenciados en productos)
- Agregar inventory movements (funcionalidad core)

### 3. Estandarización de Datos
- Unificar nomenclatura de campos entre frontend/backend
- Establecer convenciones claras para request/response formats
- Implementar validación de esquemas

### 4. Integración Frontend-Backend
- Agregar llamadas faltantes en api.ts para endpoints implementados
- Crear tipos TypeScript basados en structs Rust reales
- Implementar manejo de errores consistente

## 📋 PLAN DE ACCIÓN

### Fase 1: Documentación (Urgente)
1. Revisar cada archivo de routes/ implementado
2. Crear documentación precisa de endpoints reales
3. Actualizar endpoints.md para reflejar implementación actual

### Fase 2: Implementación (Corto plazo)
1. Implementar dashboard endpoints básicos
2. Agregar departments/brands/attributes
3. Completar inventory endpoints

### Fase 3: Integración (Mediano plazo)  
1. Actualizar frontend para usar todos los endpoints disponibles
2. Implementar funcionalidad faltante en UI
3. Agregar tests de integración frontend-backend

Este análisis revela una desconexión significativa entre documentación, implementación y uso real del sistema. La prioridad debe ser sincronizar estos tres aspectos para lograr un sistema coherente y mantenible.