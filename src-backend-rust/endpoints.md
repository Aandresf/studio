# API Endpoints Documentation

## Tabla de Contenidos
- [Autenticación](#autenticación)
- [Administración](#administración)
- [Dashboard](#dashboard)
- [Departamentos y Subdepartamentos](#departamentos-y-subdepartamentos)
- [Marcas](#marcas)
- [Atributos](#atributos)
- [Productos](#productos)
- [Variantes de Productos](#variantes-de-productos)
- [Clientes](#clientes)
- [Proveedores](#proveedores)
- [Ventas](#ventas)
- [Compras](#compras)
- [Inventario](#inventario)
- [Transacciones](#transacciones)
- [Reportes](#reportes)
- [Estadísticas](#estadísticas)
- [Búsquedas](#búsquedas)
- [Configuraciones](#configuraciones)
- [Snapshots](#snapshots)
- [SKU](#sku)
- [Tiendas](#tiendas)
- [Usuarios](#usuarios)
- [Permisos](#permisos)

---

## Autenticación

### POST `/api/auth/login`
Iniciar sesión y obtener token JWT.

**Body:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**Respuesta:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "admin",
    "role": "admin"
  }
}
```

### POST `/api/auth/logout`
Cerrar sesión (invalidar token).

### GET `/api/auth/verify`
Verificar validez del token JWT.

---

## Administración

### POST `/api/admin/backup`
Crear respaldo de la base de datos.

### POST `/api/admin/restore`
Restaurar base de datos desde respaldo.

### GET `/api/admin/system-info`
Obtener información del sistema.

### POST `/api/admin/cleanup`
Limpiar base de datos (eliminar registros obsoletos).

### GET `/api/admin/check-integrity`
Verificar integridad de la base de datos.

### GET `/api/admin/log`
Obtener registros del sistema.

---

## Dashboard

### GET `/api/dashboard`
Obtener datos generales del dashboard.

### GET `/api/dashboard/sales-summary`
Resumen de ventas.

### GET `/api/dashboard/top-products`
Productos más vendidos.

### GET `/api/dashboard/stock-alerts`
Alertas de stock bajo.

### GET `/api/dashboard/revenue-chart`
Datos para gráfico de ingresos.

---

## Departamentos y Subdepartamentos

### Departamentos

#### GET `/api/departments`
Obtener todos los departamentos.

#### GET `/api/departments/{id}`
Obtener departamento por ID.

#### POST `/api/departments`
Crear nuevo departamento.

**Body:**
```json
{
  "name": "MODA FEMENINA",
  "abbreviation": "MF"
}
```

#### PUT `/api/departments/{id}`
Actualizar departamento.

**Body:**
```json
{
  "name": "MODA FEMENINA ACTUALIZADA",
  "abbreviation": "MFA"
}
```

#### DELETE `/api/departments/{id}`
Eliminar departamento.

#### GET `/api/departments/search/{name}`
Buscar departamentos por nombre.

### Subdepartamentos

#### GET `/api/departments/{id}/subdepartments`
Obtener subdepartamentos de un departamento.

#### POST `/api/departments/{id}/subdepartments`
Crear subdepartamento en un departamento.

**Body:**
```json
{
  "name": "Vestidos",
  "abbreviation": "VES",
  "department_id": 1
}
```

#### GET `/api/departments/subdepartments/{id}`
Obtener subdepartamento por ID.

#### PUT `/api/departments/subdepartments/{id}`
Actualizar subdepartamento.

**Body:**
```json
{
  "name": "Vestidos de Noche",
  "abbreviation": "VN",
  "department_id": 1
}
```

#### DELETE `/api/departments/subdepartments/{id}`
Eliminar subdepartamento.

#### GET `/api/departments/subdepartments/search/{name}`
Buscar subdepartamentos por nombre.

---

## Marcas

#### GET `/api/brands`
Obtener todas las marcas.

#### GET `/api/brands/{id}`
Obtener marca por ID.

#### POST `/api/brands`
Crear nueva marca.

**Body:**
```json
{
  "name": "Nike",
  "abbreviation": "NK"
}
```

#### PUT `/api/brands/{id}`
Actualizar marca.

#### DELETE `/api/brands/{id}`
Eliminar marca.

#### GET `/api/brands/search/{name}`
Buscar marcas por nombre.

---

## Atributos

#### GET `/api/attributes`
Obtener todos los atributos.

#### GET `/api/attributes/{id}`
Obtener atributo por ID.

#### POST `/api/attributes`
Crear nuevo atributo.

**Body:**
```json
{
  "name": "Color",
  "data_type": "string"
}
```

#### PUT `/api/attributes/{id}`
Actualizar atributo.

#### DELETE `/api/attributes/{id}`
Eliminar atributo.

#### GET `/api/attributes/search/{name}`
Buscar atributos por nombre.

### Valores de Atributos

#### GET `/api/attributes/{id}/values`
Obtener valores de un atributo.

#### POST `/api/attributes/{id}/values`
Crear valor para un atributo.

**Body:**
```json
{
  "value": "Rojo",
  "attribute_id": 1
}
```

#### PUT `/api/attributes/values/{id}`
Actualizar valor de atributo.

#### DELETE `/api/attributes/values/{id}`
Eliminar valor de atributo.

---

## Productos

#### GET `/api/products`
Obtener todos los productos con paginación.

**Query Parameters:**
- `limit`: Número de productos por página
- `offset`: Número de productos a saltar
- `search`: Término de búsqueda

#### GET `/api/products/{id}`
Obtener producto por ID.

#### POST `/api/products`
Crear nuevo producto.

**Body:**
```json
{
  "name": "Vestido Elegante",
  "description": "Vestido para ocasiones especiales",
  "base_price": 150.00,
  "brand_id": 1,
  "subdepartment_id": 1
}
```

#### PUT `/api/products/{id}`
Actualizar producto.

#### DELETE `/api/products/{id}`
Eliminar producto.

#### GET `/api/products/search/{name}`
Buscar productos por nombre.

#### GET `/api/products/{id}/details`
Obtener detalles completos del producto incluyendo variantes.

---

## Variantes de Productos

#### GET `/api/variants`
Obtener todas las variantes.

#### GET `/api/variants/{id}`
Obtener variante por ID.

#### POST `/api/variants`
Crear nueva variante.

**Body:**
```json
{
  "product_id": 1,
  "sku": "VES-001-R-M",
  "price": 150.00,
  "stock": 10,
  "attributes": [
    {"attribute_id": 1, "value": "Rojo"},
    {"attribute_id": 2, "value": "M"}
  ]
}
```

#### PUT `/api/variants/{id}`
Actualizar variante.

#### DELETE `/api/variants/{id}`
Eliminar variante.

---

## Clientes

#### GET `/api/customers`
Obtener todos los clientes.

#### GET `/api/customers/{id}`
Obtener cliente por ID.

#### POST `/api/customers`
Crear nuevo cliente.

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@email.com",
  "phone": "123-456-7890",
  "address": "Calle Principal 123"
}
```

#### PUT `/api/customers/{id}`
Actualizar cliente.

#### DELETE `/api/customers/{id}`
Eliminar cliente.

#### GET `/api/customers/search/{name}`
Buscar clientes por nombre.

---

## Proveedores

#### GET `/api/suppliers`
Obtener todos los proveedores.

#### GET `/api/suppliers/{id}`
Obtener proveedor por ID.

#### POST `/api/suppliers`
Crear nuevo proveedor.

**Body:**
```json
{
  "name": "Proveedor ABC",
  "contact_name": "María García",
  "email": "contacto@proveedorabc.com",
  "phone": "987-654-3210",
  "address": "Av. Industrial 456"
}
```

#### PUT `/api/suppliers/{id}`
Actualizar proveedor.

#### DELETE `/api/suppliers/{id}`
Eliminar proveedor.

#### GET `/api/suppliers/search/{name}`
Buscar proveedores por nombre.

---

## Ventas

#### GET `/api/sales`
Obtener todas las ventas.

#### GET `/api/sales/{id}`
Obtener venta por ID.

#### POST `/api/sales`
Crear nueva venta.

**Body:**
```json
{
  "customer_id": 1,
  "items": [
    {
      "variant_id": 1,
      "quantity": 2,
      "unit_price": 150.00
    }
  ],
  "payment_method": "efectivo",
  "discount": 0.0
}
```

#### POST `/api/sales/{id}/annul`
Anular venta.

---

## Compras

#### GET `/api/purchases`
Obtener todas las compras.

#### GET `/api/purchases/{id}`
Obtener compra por ID.

#### POST `/api/purchases`
Crear nueva compra.

**Body:**
```json
{
  "supplier_id": 1,
  "items": [
    {
      "variant_id": 1,
      "quantity": 10,
      "unit_cost": 80.00
    }
  ]
}
```

#### POST `/api/purchases/{id}/annul`
Anular compra.

---

## Inventario

#### GET `/api/inventory/movements`
Obtener movimientos de inventario.

**Query Parameters:**
- `limit`: Número de movimientos
- `offset`: Offset para paginación
- `product_id`: Filtrar por producto
- `movement_type`: Tipo de movimiento
- `start_date`: Fecha de inicio
- `end_date`: Fecha de fin

#### POST `/api/inventory/movement`
Crear movimiento de inventario.

**Body:**
```json
{
  "variant_id": 1,
  "movement_type": "entrada",
  "quantity": 5,
  "reason": "Reposición de stock",
  "reference": "REF-001"
}
```

#### GET `/api/inventory/stock-alerts`
Obtener alertas de stock bajo.

#### GET `/api/inventory/valuation`
Obtener valoración del inventario.

---

## Transacciones

#### GET `/api/transactions`
Obtener transacciones pendientes.

#### GET `/api/transactions/{id}`
Obtener transacción por ID.

#### POST `/api/transactions/{id}/approve`
Aprobar transacción.

#### POST `/api/transactions/{id}/reject`
Rechazar transacción.

---

## Reportes

#### GET `/api/reports/products`
Reporte de productos.

**Query Parameters:**
- `start_date`: Fecha de inicio
- `end_date`: Fecha de fin
- `category`: Categoría de productos

#### GET `/api/reports/inventory`
Reporte de inventario.

#### GET `/api/reports/customers`
Reporte de clientes.

---

## Estadísticas

#### GET `/api/stats/sales`
Estadísticas de ventas.

#### GET `/api/stats/products`
Estadísticas de productos.

#### GET `/api/stats/inventory`
Estadísticas de inventario.

#### GET `/api/stats/customers`
Estadísticas de clientes.

#### GET `/api/stats/profit`
Estadísticas de ganancias.

#### GET `/api/stats/trends`
Estadísticas de tendencias.

---

## Búsquedas

#### GET `/api/search`
Búsqueda global.

**Query Parameters:**
- `q`: Término de búsqueda
- `type`: Tipo de entidad (opcional)

#### GET `/api/search/products`
Búsqueda específica de productos.

#### GET `/api/search/sales`
Búsqueda específica de ventas.

#### GET `/api/search/purchases`
Búsqueda específica de compras.

#### GET `/api/search/customers`
Búsqueda específica de clientes.

#### GET `/api/search/suppliers`
Búsqueda específica de proveedores.

#### GET `/api/search/users`
Búsqueda específica de usuarios.

---

## Configuraciones

#### GET `/api/settings`
Obtener todas las configuraciones.

#### GET `/api/settings/{key}`
Obtener configuración por clave.

#### PUT `/api/settings/{key}`
Actualizar configuración.

**Body:**
```json
{
  "value": "nuevo_valor"
}
```

#### POST `/api/settings`
Crear nueva configuración.

**Body:**
```json
{
  "key": "nueva_config",
  "value": "valor",
  "category": "general"
}
```

#### DELETE `/api/settings/{key}`
Eliminar configuración.

#### GET `/api/settings/category/{category}`
Obtener configuraciones por categoría.

---

## Snapshots

#### GET `/api/snapshots`
Obtener todos los snapshots.

#### POST `/api/snapshots`
Crear nuevo snapshot.

**Body:**
```json
{
  "name": "Snapshot Mensual",
  "description": "Snapshot de fin de mes"
}
```

#### GET `/api/snapshots/{id}`
Obtener snapshot por ID.

#### DELETE `/api/snapshots/{id}`
Eliminar snapshot.

#### GET `/api/snapshots/{id}/compare/{target_id}`
Comparar dos snapshots.

#### POST `/api/snapshots/{id}/restore`
Restaurar desde snapshot.

---

## SKU

#### GET `/api/sku/next`
Obtener siguiente SKU disponible.

**Query Parameters:**
- `department_id`: ID del departamento
- `subdepartment_id`: ID del subdepartamento
- `brand_id`: ID de la marca

#### GET `/api/sku/preview`
Previsualizar SKU.

**Query Parameters:**
- Mismos parámetros que `/next`

---

## Tiendas

#### GET `/api/stores`
Obtener todas las tiendas.

#### GET `/api/stores/active`
Obtener tienda activa.

#### PUT `/api/stores/active`
Establecer tienda activa.

**Body:**
```json
{
  "store_id": 1
}
```

#### GET `/api/stores/{id}`
Obtener tienda por ID.

#### POST `/api/stores`
Crear nueva tienda.

**Body:**
```json
{
  "name": "Tienda Centro",
  "address": "Calle Principal 123",
  "phone": "123-456-7890"
}
```

#### PUT `/api/stores/{id}`
Actualizar tienda.

#### DELETE `/api/stores/{id}`
Eliminar tienda.

---

## Usuarios

#### GET `/api/users`
Obtener todos los usuarios.

#### GET `/api/users/{id}`
Obtener usuario por ID.

#### POST `/api/users`
Crear nuevo usuario.

**Body:**
```json
{
  "username": "nuevo_usuario",
  "password": "contraseña",
  "email": "usuario@email.com",
  "role_id": "rol_id"
}
```

#### PUT `/api/users/{id}`
Actualizar usuario.

#### DELETE `/api/users/{id}`
Eliminar usuario.

---

## Permisos

#### GET `/api/users/{id}/permissions`
Obtener permisos de usuario.

#### PUT `/api/users/{id}/permissions`
Actualizar permisos de usuario.

**Body:**
```json
{
  "permissions": ["products:read", "products:edit"]
}
```

#### GET `/api/meta/permissions`
Obtener metadata de permisos disponibles.

---

## Autenticación y Seguridad

Todos los endpoints (excepto `/api/auth/login`) requieren un token JWT válido en el header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Códigos de Estado HTTP

- `200`: OK - Solicitud exitosa
- `201`: Created - Recurso creado exitosamente  
- `400`: Bad Request - Error en los datos enviados
- `401`: Unauthorized - Token inválido o expirado
- `403`: Forbidden - Sin permisos para esta acción
- `404`: Not Found - Recurso no encontrado
- `409`: Conflict - Conflicto (ej: nombre duplicado)
- `500`: Internal Server Error - Error del servidor

## Formato de Respuestas de Error

```json
{
  "error": "Descripción del error",
  "code": "ERROR_CODE",
  "details": "Detalles adicionales del error"
}
```

---

*Documentación generada para Studio Backend API v1.0*
*Fecha: 16 de septiembre de 2025*