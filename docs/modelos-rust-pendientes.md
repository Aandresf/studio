# Modelos de Datos para Studio (Sistema de Inventario para Tienda de Ropa)

Este documento describe los modelos de datos implementados en el backend de Rust para Studio, un sistema de inventario para tienda de ropa.

## Modelos Implementados

- ✅ **Modelo de Usuario** (`user.rs`)
- ✅ **Modelo de Producto y Variantes** (`product.rs`)
- ✅ **Modelo de Departamento y Subdepartamento** (`department.rs`)
- ✅ **Modelo de Marca** (`brand.rs`)
- ✅ **Modelo de Atributo y Valores de Atributo** (`attribute.rs`)
- ✅ **Modelo de Cliente y Proveedor** (`customer_supplier.rs`)
- ✅ **Modelo de Movimiento de Inventario** (`inventory_movement.rs`)

## Estructura de Modelos

### 1. Modelo de Usuario

```rust
// Estructura básica del modelo de usuario
pub struct User {
    pub id: String,
    pub name: Option<String>,
    pub username: String,
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub role_id: Option<String>,
    pub password_hash: String,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
```

### 2. Modelo de Producto (Implementado)

```rust
// Estructura básica del modelo de producto
pub struct Product {
    pub id: i64,
    pub name: String,
    pub base_sku: Option<String>,
    pub description: Option<String>,
    pub department_id: Option<i64>,
    pub subdepartment_id: Option<i64>,
    pub brand_id: Option<i64>,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// Estructura para variantes de producto
pub struct ProductVariant {
    pub id: i64,
    pub product_id: i64,
    pub sku: String,
    pub cost_price: f64,
    pub sale_price: f64,
    pub current_stock: f64,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
```

### 3. Modelo de Departamento (Implementado)

```rust
// Estructura básica del modelo de departamento
pub struct Department {
    pub id: i64,
    pub name: String,
    pub abbreviation: String,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// Estructura para subdepartamentos
pub struct Subdepartment {
    pub id: i64,
    pub name: String,
    pub abbreviation: String,
    pub department_id: i64,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
```

### 4. Modelo de Marca (Implementado)

```rust
// Estructura básica del modelo de marca
pub struct Brand {
    pub id: i64,
    pub name: String,
    pub subdepartment_id: Option<i64>,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
```

### 5. Modelo de Atributo (Implementado)

```rust
// Estructura básica del modelo de atributo
pub struct Attribute {
    pub id: i64,
    pub name: String,
    pub subdepartment_id: Option<i64>,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// Estructura para valores de atributos
pub struct AttributeValue {
    pub id: i64,
    pub attribute_id: i64,
    pub value: String,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
```

### 6. Modelo de Cliente (Implementado)

```rust
// Estructura básica del modelo de cliente
pub struct Customer {
    pub id: i64,
    pub name: String,
    pub document: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
}
```

### 7. Modelo de Proveedor (Implementado)

```rust
// Estructura básica del modelo de proveedor
pub struct Supplier {
    pub id: i64,
    pub name: String,
    pub document: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
}
```

### 8. Modelo de Movimiento de Inventario (Implementado)

```rust
// Estructura básica del modelo de movimiento de inventario
pub struct InventoryMovement {
    pub id: i64,
    pub variant_id: i64,
    pub transaction_id: String,
    pub transaction_date: String,
    pub entity_name: Option<String>,
    pub entity_document: Option<String>,
    pub document_number: Option<String>,
    pub movement_type: String, // ENTRADA, SALIDA, RETIRO, AUTO-CONSUMO, AJUSTE
    pub quantity: f64,
    pub unit_cost: Option<f64>,
    pub price: Option<f64>,
    pub description: Option<String>,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub user_id: Option<String>,
}
```

## Implementación de Módulos Completada

Para cada uno de los modelos anteriores, se ha implementado:

1. **Operaciones CRUD básicas**:
   - ✅ `find_by_id`: Buscar un registro por ID
   - ✅ `find_all`: Obtener todos los registros (con paginación)
   - ✅ `create`: Crear un nuevo registro
   - ✅ `update`: Actualizar un registro existente
   - ✅ `delete`: Eliminar un registro (borrado lógico)

2. **Operaciones específicas por tipo de modelo**:
   - ✅ Para productos: buscar por SKU, departamento, marca
   - ✅ Para clientes/proveedores: buscar por nombre o documento
   - ✅ Para inventario: calcular stock, histórico de movimientos

3. **Validaciones de datos**:
   - ✅ Campos requeridos
   - ✅ Unicidad (nombres, SKUs, etc.)
   - ✅ Relaciones existentes (IDs foráneos)

4. **Manejo de transacciones**:
   - ✅ Para operaciones que afecten a múltiples tablas

## Próximos Pasos

1. Integrar los modelos con las rutas API existentes
2. Implementar pruebas unitarias para todos los modelos
3. Optimizar consultas y manejo de errores
4. Implementar funcionalidades adicionales específicas para cada modelo