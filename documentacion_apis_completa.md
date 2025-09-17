# Documentación Completa de APIs - Inventario Studio

## Resumen Ejecutivo

Esta documentación proporciona un análisis completo de todas las rutas API implementadas en el sistema de inventario, comparando las llamadas del frontend (Next.js) con los endpoints del backend (Rust/Actix-web).

## Frontend API Calls (src/lib/api.ts)

### Configuración Base
- **Función Base**: `fetchAPI(endpoint, options)` 
- **Autenticación**: JWT Bearer token + HttpOnly cookies como fallback
- **Base URL**: Configurable vía `setApiBase()`
- **Headers PWA**: `x-pwa: true` cuando se ejecuta como PWA

### 1. AUTENTICACIÓN (/api/auth)

#### Frontend Calls:
```typescript
// POST /api/auth/login
login(credentials: { username: string, password: string }) 
// Request: { username, password }
// Response: { token, user }

// POST /api/auth/logout  
logout()
// Request: {} (empty body)
// Response: {} (empty response)

// GET /api/auth/status
getAuthStatus()
// Request: No body
// Response: { authenticated: boolean, user?: User }

// POST /api/auth/verify
verifyToken(token: string)
// Request: { token }
// Response: { valid: boolean, user?: User }
```

#### Backend Implementation (auth.rs):
```rust
// POST /api/auth/login
async fn login(auth_data: web::Json<AuthRequest>, ...) -> impl Responder
// Request: AuthRequest { username: String, password: String }
// Response: AuthResponse { token: String, user: UserResponse }
// Sets HttpOnly cookie: "session"

// POST /api/auth/logout  
async fn logout() -> impl Responder
// Request: No body required
// Response: { "message": "Logout successful" }
// Clears session cookie

// GET /api/auth/status
async fn status(req: HttpRequest, config: web::Data<Settings>) -> impl Responder
// Request: Reads Authorization header or session cookie
// Response: { "authenticated": true, "user": UserResponse } | { "authenticated": false }

// POST /api/auth/verify
async fn verify_token(token: web::Json<serde_json::Value>, ...) -> impl Responder
// Request: { "token": "jwt_token_string" }
// Response: { "valid": true, "user": UserResponse } | { "valid": false, "error": "..." }
```

### 2. PRODUCTOS (/api/products)

#### Frontend Calls:
```typescript
// GET /api/products
getProducts(params?: { limit?, offset?, search?, brand_id?, department_id? })
// Response: Product[]

// GET /api/products/{id}
getProduct(id: number)
// Response: Product

// POST /api/products
createProduct(product: NewProduct)
// Request: NewProduct
// Response: Product

// PUT /api/products/{id}  
updateProduct(id: number, product: UpdateProduct)
// Request: UpdateProduct
// Response: Product

// DELETE /api/products/{id}
deleteProduct(id: number)
// Response: { message: string }

// GET /api/products/count
getProductsCount()
// Response: { count: number }
```

#### Backend Implementation (products.rs):
```rust
// GET /api/products
async fn get_products(query: web::Query<ProductQuery>, ...) -> impl Responder
// Query params: ProductQuery { limit?, offset?, brand_id?, subdepartment_id?, search? }
// Response: Product[] (currently returns empty array)

// GET /api/products/{id}
async fn get_product(path: web::Path<i64>, ...) -> impl Responder
// Path param: product_id (i64)
// Response: Product | { "error": "Producto no encontrado" }

// POST /api/products
async fn create_product(product: web::Json<NewProduct>, ...) -> impl Responder
// Request: NewProduct struct
// Response: Product | error

// PUT /api/products/{id}
async fn update_product(path: web::Path<i64>, product: web::Json<UpdateProduct>, ...) -> impl Responder
// Path param: product_id, Body: UpdateProduct
// Response: Product | error

// DELETE /api/products/{id}
async fn delete_product(path: web::Path<i64>, ...) -> impl Responder
// Path param: product_id
// Response: success/error message

// GET /api/products/count
async fn count_products(...) -> impl Responder
// Response: { "count": number }

// GET /api/products/by-brand/{brand_id}
async fn get_products_by_brand(path: web::Path<i64>, ...) -> impl Responder

// GET /api/products/by-subdepartment/{subdepartment_id}  
async fn get_products_by_subdepartment(path: web::Path<i64>, ...) -> impl Responder
```

### 3. VARIANTES (/api/variants)

#### Frontend Calls:
```typescript
// GET /api/variants
getVariants(product_id?: number)
// Query: ?product_id=123
// Response: ProductVariant[]

// GET /api/variants/{id}
getVariant(id: number)  
// Response: ProductVariant

// POST /api/variants
createVariant(variant: NewProductVariant)
// Request: NewProductVariant
// Response: ProductVariant

// PUT /api/variants/{id}
updateVariant(id: number, variant: UpdateProductVariant)
// Request: UpdateProductVariant  
// Response: ProductVariant

// DELETE /api/variants/{id}
deleteVariant(id: number)
// Response: { message: string }

// GET /api/variants/{id}/movements
getVariantMovements(id: number)
// Response: Movement[]
```

#### Backend Implementation (variants.rs):
```rust
// GET /api/variants
async fn get_variants(query: web::Query<VariantsQuery>, ...) -> impl Responder
// Query: VariantsQuery { product_id: Option<i64> }
// Auth: Requires PRODUCTS_READ permission
// Response: ProductVariant[] filtered by product_id if provided

// GET /api/variants/{id}
async fn get_variant(path: web::Path<i64>, ...) -> impl Responder
// Path param: variant_id
// Auth: Requires PRODUCTS_READ permission
// Response: ProductVariantDetail | 404

// POST /api/variants  
async fn create_variant(variant_data: web::Json<NewProductVariant>, ...) -> impl Responder
// Request: NewProductVariant struct
// Auth: Requires PRODUCTS_CREATE permission
// Response: ProductVariant | error

// PUT /api/variants/{id}
async fn update_variant(path: web::Path<i64>, update_data: web::Json<UpdateProductVariant>, ...) -> impl Responder
// Path param: variant_id, Body: UpdateProductVariant
// Auth: Requires PRODUCTS_UPDATE permission  
// Response: ProductVariant | error

// DELETE /api/variants/{id}
async fn delete_variant(path: web::Path<i64>, ...) -> impl Responder
// Path param: variant_id
// Auth: Requires PRODUCTS_DELETE permission
// Response: success message | error

// GET /api/variants/{id}/movements
async fn get_variant_movements(path: web::Path<i64>, ...) -> impl Responder
// Path param: variant_id
// Auth: Requires INVENTORY_READ permission
// Response: Movement[] | error
```

### 4. VENTAS (/api/sales)

#### Frontend Calls:
```typescript
// GET /api/sales
getSales(params?: { start_date?, end_date?, limit?, offset? })
// Response: Sale[]

// GET /api/sales/{id}
getSale(id: number)
// Response: Sale with items

// POST /api/sales
createSale(sale: NewSale)
// Request: NewSale { customer_id?, items: SaleItem[], payment_method, ... }
// Response: Sale

// POST /api/sales/{id}/annul
annulSale(id: number)
// Response: { message: string }
```

#### Backend Implementation (sales.rs):
```rust
// GET /api/sales
async fn get_sales(db_pool: web::Data<DbPool>, query: web::Query<SalesQueryParams>) -> impl Responder
// Query: SalesQueryParams { start_date?, end_date?, limit?, offset? }
// Response: Sale[]

// GET /api/sales/{id}
async fn get_sale(db_pool: web::Data<DbPool>, id: web::Path<i64>) -> impl Responder
// Path param: sale_id
// Response: Sale with full details

// POST /api/sales
async fn create_sale(db_pool: web::Data<DbPool>, sale: web::Json<Sale>) -> impl Responder
// Request: Sale struct with items
// Response: Created Sale | error

// POST /api/sales/{id}/annul
async fn annul_sale(db_pool: web::Data<DbPool>, id: web::Path<i64>) -> impl Responder
// Path param: sale_id
// Response: success/error message
```

### 5. CLIENTES (/api/customers)

#### Frontend Calls (api-customers.ts):
```typescript
// GET /api/customers
getCustomers(params?: { search?, limit?, offset? })
// Response: Customer[]

// GET /api/customers/{id}
getCustomer(id: number)
// Response: Customer

// POST /api/customers
createCustomer(customer: NewCustomer)
// Request: NewCustomer
// Response: Customer

// PUT /api/customers/{id}
updateCustomer(id: number, customer: UpdateCustomer)
// Request: UpdateCustomer
// Response: Customer

// DELETE /api/customers/{id}
deleteCustomer(id: number)
// Response: { message: string }

// GET /api/customers/count
getCustomersCount()
// Response: { count: number }
```

#### Backend Implementation (customers.rs):
```rust
// Similar structure to products with CRUD operations
// Auth: Requires CUSTOMERS_* permissions
// Endpoints: "", "/{id}", "/count"
```

### 6. PROVEEDORES (/api/suppliers)

Similar structure to customers with full CRUD operations.

### 7. REPORTES (/api/reports)

#### Frontend Calls:
```typescript
// GET /api/reports/sales
getSalesReport(params: { start_date, end_date, format? })

// GET /api/reports/inventory  
getInventoryReport(params?: { format?, include_zero_stock? })

// GET /api/reports/profit
getProfitReport(params: { start_date, end_date })

// GET /api/reports/top-products
getTopProductsReport(params: { start_date, end_date, limit? })
```

### 8. ESTADÍSTICAS (/api/stats)

#### Backend Implementation (stats.rs):
```rust
// GET /api/stats/sales
async fn get_sales_stats(query: web::Query<StatsQuery>) -> impl Responder

// GET /api/stats/products  
async fn get_product_stats(query: web::Query<StatsQuery>) -> impl Responder

// GET /api/stats/inventory
async fn get_inventory_stats(query: web::Query<StatsQuery>) -> impl Responder

// GET /api/stats/customers
async fn get_customer_stats(query: web::Query<StatsQuery>) -> impl Responder

// GET /api/stats/profit
async fn get_profit_stats(query: web::Query<StatsQuery>) -> impl Responder

// GET /api/stats/trends
async fn get_trend_stats(query: web::Query<StatsQuery>) -> impl Responder
```

### 9. USUARIOS (/api/users)

#### Backend Implementation (users.rs):
```rust
// Full CRUD operations with role-based permissions
// GET /api/users - get_users()
// GET /api/users/{id} - get_user()
// POST /api/users - create_user()
// PUT /api/users/{id} - update_user()
// DELETE /api/users/{id} - delete_user()
// GET /api/users/count - count_users()
```

### 10. SNAPSHOTS (/api/snapshots)

#### Backend Implementation (snapshots.rs):
```rust
// GET /api/snapshots - get_all_snapshots()
// POST /api/snapshots - create_snapshot()
// GET /api/snapshots/{id} - get_snapshot()
// DELETE /api/snapshots/{id} - delete_snapshot()
// GET /api/snapshots/{id}/compare/{target_id} - compare_snapshots()
// POST /api/snapshots/{id}/restore - restore_snapshot()
```

### 11. SKU (/api/sku)

#### Backend Implementation (sku.rs):
```rust
// GET /api/sku/next - get_next_sku()
// GET /api/sku/preview - preview_sku()
```

### 12. TRANSACCIONES PENDIENTES (/api/pending-transactions)

#### Backend Implementation (pending_transactions.rs):
```rust
// GET /api/pending-transactions - get_pending_transactions()
// POST /api/pending-transactions - create_pending_transaction()
// DELETE /api/pending-transactions/{id} - delete_pending_transaction()
```

## Discrepancias Identificadas

### 1. Campo Mismatch en Variantes (CORREGIDO)
- **Problema**: Frontend esperaba `price`, `cost`, `stock` pero backend tenía `sale_price`, `cost_price`, `current_stock`
- **Estado**: ✅ Corregido en structs Rust y consultas SQL

### 2. Endpoints No Implementados en Frontend
- `/api/stats/*` - Solo existe en backend
- `/api/snapshots/*` - Solo existe en backend  
- `/api/sku/*` - Solo existe en backend
- `/api/pending-transactions/*` - Solo existe en backend

### 3. Endpoints Con Discrepancias
- **Products by department**: Frontend usa `department_id`, backend usa `subdepartment_id`
- **Stats endpoints**: Backend implementado pero frontend no tiene llamadas correspondientes

## Recomendaciones

1. **Agregar wrapper functions** en `api.ts` para endpoints faltantes (stats, snapshots, sku)
2. **Estandarizar nomenclatura** de parámetros entre frontend y backend
3. **Implementar manejo de errores** consistente en todas las rutas
4. **Documentar tipos TypeScript** para todos los requests/responses
5. **Agregar validación de permisos** en frontend antes de hacer llamadas

## Estructura de Permisos

El backend implementa un sistema robusto de permisos:
- `PRODUCTS_READ/CREATE/UPDATE/DELETE`
- `CUSTOMERS_READ/CREATE/UPDATE/DELETE`  
- `INVENTORY_READ/CREATE/UPDATE/DELETE`
- `SALES_READ/CREATE/UPDATE/DELETE`
- `USERS_READ/CREATE/UPDATE/DELETE`

Cada endpoint crítico verifica permisos usando el middleware `Authorize`.