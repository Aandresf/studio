// src-backend-rust/src/models/product.rs

use crate::database_manager::DbPool;
use rusqlite::{params, Result as SqliteResult, Error as SqliteError};
use serde::{Deserialize, Serialize};
use log::{debug, error};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
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

#[derive(Debug, Serialize, Deserialize)]
pub struct NewProduct {
    pub name: String,
    pub base_sku: Option<String>,
    pub description: Option<String>,
    pub department_id: Option<i64>,
    pub subdepartment_id: Option<i64>,
    pub brand_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProduct {
    pub name: Option<String>,
    pub base_sku: Option<String>,
    pub description: Option<String>,
    pub department_id: Option<i64>,
    pub subdepartment_id: Option<i64>,
    pub brand_id: Option<i64>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProductDetail {
    pub product: Product,
    pub brand_name: String,
    pub subdepartment_name: String,
    pub department_name: String,
    pub total_stock: i64,
    pub variants: Vec<ProductVariantDetail>,
}

impl Product {
    // Buscar un producto por ID
    pub fn find_by_id(pool: &DbPool, id: i64) -> SqliteResult<Option<Product>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, base_sku, description, department_id, subdepartment_id, brand_id, status, deleted_at, deleted_by, created_at, updated_at 
            FROM products 
            WHERE id = ? AND (status IS NULL OR status <> 'deleted')"
        )?;
        
        let rows = stmt.query_map(params![id], |row| {
            Ok(Product {
                id: row.get(0)?,
                name: row.get(1)?,
                base_sku: row.get(2)?,
                description: row.get(3)?,
                department_id: row.get(4)?,
                subdepartment_id: row.get(5)?,
                brand_id: row.get(6)?,
                status: row.get(7)?,
                deleted_at: row.get(8)?,
                deleted_by: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;
        
        let mut products: Vec<Product> = Vec::new();
        for row in rows {
            products.push(row?);
        }
        
        if products.is_empty() {
            Ok(None)
        } else {
            Ok(Some(products[0].clone()))
        }
    }
    
    // Buscar un producto por código
    pub fn find_by_code(pool: &DbPool, base_sku: &str) -> SqliteResult<Option<Product>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, base_sku, description, department_id, subdepartment_id, brand_id, status, deleted_at, deleted_by, created_at, updated_at 
            FROM products 
            WHERE base_sku = ? AND (status IS NULL OR status <> 'deleted')"
        )?;
        
        let rows = stmt.query_map(params![base_sku], |row| {
            Ok(Product {
                id: row.get(0)?,
                name: row.get(1)?,
                base_sku: row.get(2)?,
                description: row.get(3)?,
                department_id: row.get(4)?,
                subdepartment_id: row.get(5)?,
                brand_id: row.get(6)?,
                status: row.get(7)?,
                deleted_at: row.get(8)?,
                deleted_by: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;
        
        let mut products: Vec<Product> = Vec::new();
        for row in rows {
            products.push(row?);
        }
        
        if products.is_empty() {
            Ok(None)
        } else {
            Ok(Some(products[0].clone()))
        }
    }
    
    // Obtener todos los productos
    pub fn find_all(pool: &DbPool, limit: Option<i64>, offset: Option<i64>) -> SqliteResult<Vec<Product>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut query = String::from(
            "SELECT id, name, base_sku, description, department_id, subdepartment_id, brand_id, status, deleted_at, deleted_by, created_at, updated_at 
            FROM products 
            WHERE (status IS NULL OR status <> 'deleted')
            ORDER BY name ASC"
        );
        
        if let Some(limit_val) = limit {
            query.push_str(&format!(" LIMIT {}", limit_val));
            
            if let Some(offset_val) = offset {
                query.push_str(&format!(" OFFSET {}", offset_val));
            }
        }
        
        let mut stmt = conn.prepare(&query)?;
        
        let rows = stmt.query_map(params![], |row| {
            Ok(Product {
                id: row.get(0)?,
                name: row.get(1)?,
                base_sku: row.get(2)?,
                description: row.get(3)?,
                department_id: row.get(4)?,
                subdepartment_id: row.get(5)?,
                brand_id: row.get(6)?,
                status: row.get(7)?,
                deleted_at: row.get(8)?,
                deleted_by: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;
        
        let mut products: Vec<Product> = Vec::new();
        for row in rows {
            products.push(row?);
        }
        
        Ok(products)
    }
    
    // Obtener el número total de productos
    pub fn count_all(pool: &DbPool) -> SqliteResult<i64> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT COUNT(*) FROM products WHERE (status IS NULL OR status <> 'deleted')"
        )?;
        
        let count: i64 = stmt.query_row(params![], |row| row.get(0))?;
        
        Ok(count)
    }
    
    // Filtrar productos por subdepartamento
    pub fn find_by_subdepartment(pool: &DbPool, subdepartment_id: i64) -> SqliteResult<Vec<Product>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, base_sku, description, department_id, subdepartment_id, brand_id, status, deleted_at, deleted_by, created_at, updated_at 
            FROM products 
            WHERE (status IS NULL OR status <> 'deleted') AND subdepartment_id = ?
            ORDER BY name ASC"
        )?;
        
        let rows = stmt.query_map(params![subdepartment_id], |row| {
            Ok(Product {
                id: row.get(0)?,
                name: row.get(1)?,
                base_sku: row.get(2)?,
                description: row.get(3)?,
                department_id: row.get(4)?,
                subdepartment_id: row.get(5)?,
                brand_id: row.get(6)?,
                status: row.get(7)?,
                deleted_at: row.get(8)?,
                deleted_by: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;
        
        let mut products: Vec<Product> = Vec::new();
        for row in rows {
            products.push(row?);
        }
        
        Ok(products)
    }
    
    // Filtrar productos por marca
    pub fn find_by_brand(pool: &DbPool, brand_id: i64) -> SqliteResult<Vec<Product>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, base_sku, description, department_id, subdepartment_id, brand_id, status, deleted_at, deleted_by, created_at, updated_at 
            FROM products 
            WHERE (status IS NULL OR status <> 'deleted') AND brand_id = ?
            ORDER BY name ASC"
        )?;
        
        let rows = stmt.query_map(params![brand_id], |row| {
            Ok(Product {
                id: row.get(0)?,
                name: row.get(1)?,
                base_sku: row.get(2)?,
                description: row.get(3)?,
                department_id: row.get(4)?,
                subdepartment_id: row.get(5)?,
                brand_id: row.get(6)?,
                status: row.get(7)?,
                deleted_at: row.get(8)?,
                deleted_by: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;
        
        let mut products: Vec<Product> = Vec::new();
        for row in rows {
            products.push(row?);
        }
        
        Ok(products)
    }
    
    // Crear un nuevo producto
    pub fn create(pool: &DbPool, product: NewProduct) -> SqliteResult<Product> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si ya existe un producto con el mismo base_sku (si se proporciona)
        if let Some(ref base_sku) = product.base_sku {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM products WHERE base_sku = ?")?;
            let count: i64 = stmt.query_row(params![base_sku], |row| row.get(0))?;
            
            if count > 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some("Ya existe un producto con ese base_sku".to_string()),
                ));
            }
        }
        
        // Verificar si existe la marca (si se proporciona)
        if let Some(brand_id) = product.brand_id {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM brands WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
            let count: i64 = stmt.query_row(params![brand_id], |row| row.get(0))?;
            
            if count == 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some("La marca especificada no existe".to_string()),
                ));
            }
        }
        
        // Verificar si existe el subdepartamento (si se proporciona)
        if let Some(subdepartment_id) = product.subdepartment_id {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM subdepartments WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
            let count: i64 = stmt.query_row(params![subdepartment_id], |row| row.get(0))?;
            
            if count == 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some("El subdepartamento especificado no existe".to_string()),
                ));
            }
        }
        
        // Verificar si existe el departamento (si se proporciona)
        if let Some(department_id) = product.department_id {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM departments WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
            let count: i64 = stmt.query_row(params![department_id], |row| row.get(0))?;
            
            if count == 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some("El departamento especificado no existe".to_string()),
                ));
            }
        }
        
        // Insertar el nuevo producto
        conn.execute(
            "INSERT INTO products (name, base_sku, description, department_id, subdepartment_id, brand_id, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, 'Activo', strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'))",
            params![
                product.name, 
                product.base_sku, 
                product.description, 
                product.department_id, 
                product.subdepartment_id, 
                product.brand_id
            ],
        )?;
        
        let id = conn.last_insert_rowid();
        debug!("Producto creado con ID: {}", id);
        
        // Obtener el producto recién creado
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar el producto recién creado");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Actualizar un producto existente
    pub fn update(pool: &DbPool, id: i64, update: UpdateProduct) -> SqliteResult<Product> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el producto existe
        let product = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Producto no encontrado para actualizar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Verificar unicidad del código si se está actualizando
        if let Some(base_sku) = &update.base_sku {
            if Some(base_sku) != product.base_sku.as_ref() {
                let mut stmt = conn.prepare("SELECT COUNT(*) FROM products WHERE base_sku = ? AND id <> ?")?;
                let count: i64 = stmt.query_row(params![base_sku, id], |row| row.get(0))?;
                
                if count > 0 {
                    return Err(SqliteError::SqliteFailure(
                        rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                        Some("Ya existe un producto con ese SKU base".to_string()),
                    ));
                }
            }
        }
        
        // Verificar si existe la marca (si se está actualizando)
        if let Some(brand_id) = update.brand_id {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM brands WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
            let count: i64 = stmt.query_row(params![brand_id], |row| row.get(0))?;
            
            if count == 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some("La marca especificada no existe".to_string()),
                ));
            }
        }
        
        // Verificar si existe el subdepartamento (si se está actualizando)
        if let Some(subdepartment_id) = update.subdepartment_id {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM subdepartments WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
            let count: i64 = stmt.query_row(params![subdepartment_id], |row| row.get(0))?;
            
            if count == 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some("El subdepartamento especificado no existe".to_string()),
                ));
            }
        }
        
        // Construir la consulta de actualización
        let mut query = String::from("UPDATE products SET ");
        let mut params_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(base_sku) = update.base_sku {
            query.push_str("base_sku = ?, ");
            params_values.push(Box::new(base_sku));
        }
        
        if let Some(name) = update.name {
            query.push_str("name = ?, ");
            params_values.push(Box::new(name));
        }
        
        if let Some(description) = update.description {
            query.push_str("description = ?, ");
            params_values.push(Box::new(description));
        }
        
        if let Some(department_id) = update.department_id {
            query.push_str("department_id = ?, ");
            params_values.push(Box::new(department_id));
        }
        
        if let Some(subdepartment_id) = update.subdepartment_id {
            query.push_str("subdepartment_id = ?, ");
            params_values.push(Box::new(subdepartment_id));
        }
        
        if let Some(brand_id) = update.brand_id {
            query.push_str("brand_id = ?, ");
            params_values.push(Box::new(brand_id));
        }
        
        if let Some(status) = update.status {
            query.push_str("status = ?, ");
            params_values.push(Box::new(status));
        }
        
        query.push_str("updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = ?");
        params_values.push(Box::new(id));
        
        let params_refs: Vec<&dyn rusqlite::ToSql> = params_values
            .iter()
            .map(|param| param.as_ref())
            .collect();
        
        conn.execute(&query, params_refs.as_slice())?;
        
        // Obtener el producto actualizado
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar el producto después de actualizar");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Eliminar un producto (borrado lógico)
    pub fn delete(pool: &DbPool, id: i64, deleted_by: Option<String>) -> SqliteResult<()> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el producto existe
        let _product = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Producto no encontrado para eliminar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Verificar si tiene variantes
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM product_variants WHERE product_id = ? AND (status IS NULL OR status <> 'deleted')")?;
        let count: i64 = stmt.query_row(params![id], |row| row.get(0))?;
        
        if count > 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("No se puede eliminar el producto porque tiene variantes asociadas".to_string()),
            ));
        }
        
        // Realizar el borrado lógico
        conn.execute(
            "UPDATE products SET status = 'deleted', deleted_at = strftime('%Y-%m-%d %H:%M:%S', 'now'), deleted_by = ? WHERE id = ?",
            params![deleted_by, id],
        )?;
        
        Ok(())
    }
    
    // Buscar productos por nombre (búsqueda parcial)
    pub fn search_by_name(pool: &DbPool, name: &str) -> SqliteResult<Vec<Product>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let search_pattern = format!("%{}%", name);
        
        let mut stmt = conn.prepare(
            "SELECT id, name, base_sku, description, department_id, subdepartment_id, brand_id, status, deleted_at, deleted_by, created_at, updated_at 
            FROM products 
            WHERE (status IS NULL OR status <> 'deleted') AND name LIKE ?
            ORDER BY name ASC"
        )?;
        
        let rows = stmt.query_map(params![search_pattern], |row| {
            Ok(Product {
                id: row.get(0)?,
                name: row.get(1)?,
                base_sku: row.get(2)?,
                description: row.get(3)?,
                department_id: row.get(4)?,
                subdepartment_id: row.get(5)?,
                brand_id: row.get(6)?,
                status: row.get(7)?,
                deleted_at: row.get(8)?,
                deleted_by: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;
        
        let mut products: Vec<Product> = Vec::new();
        for row in rows {
            products.push(row?);
        }
        
        Ok(products)
    }
    
    // Obtener un producto con detalles (incluye información relacionada)
    pub fn find_with_details(pool: &DbPool, id: i64) -> SqliteResult<Option<ProductDetail>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Obtener el producto principal
        let product = match Self::find_by_id(pool, id)? {
            Some(p) => p,
            None => return Ok(None),
        };
        
        // Obtener información de la marca
        let mut stmt = conn.prepare("SELECT name FROM brands WHERE id = ?")?;
        let brand_name: String = stmt.query_row(params![product.brand_id], |row| row.get(0))?;
        
        // Obtener información del subdepartamento
        let mut stmt = conn.prepare("SELECT name, department_id FROM subdepartments WHERE id = ?")?;
        let (subdepartment_name, department_id): (String, i64) = stmt.query_row(params![product.subdepartment_id], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })?;
        
        // Obtener información del departamento
        let mut stmt = conn.prepare("SELECT name FROM departments WHERE id = ?")?;
        let department_name: String = stmt.query_row(params![department_id], |row| row.get(0))?;
        
        // Obtener total de stock sumando todas las variantes
        let mut stmt = conn.prepare("SELECT COALESCE(SUM(current_stock), 0) FROM product_variants WHERE product_id = ? AND (status IS NULL OR status <> 'deleted')")?;
        let total_stock: i64 = stmt.query_row(params![id], |row| row.get(0))?;
        
        // Obtener las variantes del producto
        let variants = ProductVariant::find_by_product_with_details(pool, id)?;
        
        Ok(Some(ProductDetail {
            product,
            brand_name,
            subdepartment_name,
            department_name,
            total_stock,
            variants,
        }))
    }
}

// Modelo para variantes de productos
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProductVariant {
    pub id: i64,
    pub product_id: i64,
    pub sku: String,
    pub sale_price: f64,        // Coincide con schema: sale_price REAL NOT NULL DEFAULT 0
    pub cost_price: f64,        // Coincide con schema: cost_price REAL NOT NULL DEFAULT 0
    pub current_stock: f64,     // Coincide con schema: current_stock REAL NOT NULL DEFAULT 0
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewProductVariant {
    pub product_id: i64,
    pub sku: String,
    pub sale_price: Option<f64>,     // Opcional en creación, default 0 en DB
    pub cost_price: Option<f64>,     // Opcional en creación, default 0 en DB
    pub current_stock: Option<f64>,  // Opcional en creación, default 0 en DB
    pub attribute_values: Vec<i64>, // IDs de los valores de atributos para esta variante
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProductVariant {
    pub sku: Option<String>,
    pub sale_price: Option<f64>,
    pub cost_price: Option<f64>,
    pub current_stock: Option<f64>,
    pub status: Option<String>,
    pub attribute_values: Option<Vec<i64>>, // IDs de los valores de atributos para actualizar
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProductVariantDetail {
    pub variant: ProductVariant,
    pub attributes: HashMap<String, String>, // Mapa de nombre_atributo -> valor_atributo
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProductVariantAttribute {
    pub id: i64,
    pub product_variant_id: i64,
    pub attribute_value_id: i64,
}

impl ProductVariant {
    // Buscar todas las variantes de productos
    pub fn find_all(pool: &DbPool) -> SqliteResult<Vec<ProductVariant>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT pv.id, pv.product_id, pv.sku, pv.sale_price, pv.cost_price, pv.current_stock, pv.status, pv.deleted_at, pv.deleted_by, pv.created_at, pv.updated_at 
            FROM product_variants pv 
            JOIN products p ON pv.product_id = p.id 
            WHERE (pv.status IS NULL OR pv.status <> 'deleted') 
            ORDER BY pv.id ASC"
        )?;
        
        let variants_iter = stmt.query_map([], |row| {
            Ok(ProductVariant {
                id: row.get(0)?,
                product_id: row.get(1)?,
                sku: row.get(2)?,
                sale_price: row.get(3)?,
                cost_price: row.get(4)?,
                current_stock: row.get(5)?,
                status: row.get(6)?,
                deleted_at: row.get(7)?,
                deleted_by: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?;
        
        let mut variants = Vec::new();
        for variant in variants_iter {
            variants.push(variant?);
        }
        
        Ok(variants)
    }
    
    // Buscar una variante de producto por ID
    pub fn find_by_id(pool: &DbPool, id: i64) -> SqliteResult<Option<ProductVariant>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, product_id, sku, sale_price, cost_price, current_stock, status, deleted_at, deleted_by, created_at, updated_at 
            FROM product_variants 
            WHERE id = ? AND (status IS NULL OR status <> 'deleted')"
        )?;
        
        let rows = stmt.query_map(params![id], |row| {
            Ok(ProductVariant {
                id: row.get(0)?,
                product_id: row.get(1)?,
                sku: row.get(2)?,
                sale_price: row.get(3)?,
                cost_price: row.get(4)?,
                current_stock: row.get(5)?,
                status: row.get(6)?,
                deleted_at: row.get(7)?,
                deleted_by: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?;
        
        let mut variants: Vec<ProductVariant> = Vec::new();
        for row in rows {
            variants.push(row?);
        }
        
        if variants.is_empty() {
            Ok(None)
        } else {
            Ok(Some(variants[0].clone()))
        }
    }
    
    // Buscar una variante de producto por SKU
    pub fn find_by_sku(pool: &DbPool, sku: &str) -> SqliteResult<Option<ProductVariant>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, product_id, sku, sale_price, cost_price, current_stock, status, deleted_at, deleted_by, created_at, updated_at 
            FROM product_variants 
            WHERE sku = ? AND (status IS NULL OR status <> 'deleted')"
        )?;
        
        let rows = stmt.query_map(params![sku], |row| {
            Ok(ProductVariant {
                id: row.get(0)?,
                product_id: row.get(1)?,
                sku: row.get(2)?,
                sale_price: row.get(3)?,
                cost_price: row.get(4)?,
                current_stock: row.get(5)?,
                status: row.get(6)?,
                deleted_at: row.get(7)?,
                deleted_by: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?;
        
        let mut variants: Vec<ProductVariant> = Vec::new();
        for row in rows {
            variants.push(row?);
        }
        
        if variants.is_empty() {
            Ok(None)
        } else {
            Ok(Some(variants[0].clone()))
        }
    }
    
    // Obtener variantes por producto
    pub fn find_by_product(pool: &DbPool, product_id: i64) -> SqliteResult<Vec<ProductVariant>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, product_id, sku, sale_price, cost_price, current_stock, status, deleted_at, deleted_by, created_at, updated_at 
            FROM product_variants 
            WHERE product_id = ? AND (status IS NULL OR status <> 'deleted')
            ORDER BY sku ASC"
        )?;
        
        let rows = stmt.query_map(params![product_id], |row| {
            Ok(ProductVariant {
                id: row.get(0)?,
                product_id: row.get(1)?,
                sku: row.get(2)?,
                sale_price: row.get(3)?,
                cost_price: row.get(4)?,
                current_stock: row.get(5)?,
                status: row.get(6)?,
                deleted_at: row.get(7)?,
                deleted_by: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?;
        
        let mut variants: Vec<ProductVariant> = Vec::new();
        for row in rows {
            variants.push(row?);
        }
        
        Ok(variants)
    }
    
    // Obtener variantes por producto con detalles de atributos
    pub fn find_by_product_with_details(pool: &DbPool, product_id: i64) -> SqliteResult<Vec<ProductVariantDetail>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Obtener todas las variantes del producto
        let variants = Self::find_by_product(pool, product_id)?;
        
        let mut result: Vec<ProductVariantDetail> = Vec::new();
        
        for variant in variants {
            // Para cada variante, obtener sus atributos
            let mut stmt = conn.prepare(
                "SELECT a.name, av.value 
                FROM variant_attribute_values pva
                JOIN attribute_values av ON pva.attribute_value_id = av.id
                JOIN attributes a ON av.attribute_id = a.id
                WHERE pva.product_variant_id = ?"
            )?;
            
            let rows = stmt.query_map(params![variant.id], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })?;
            
            let mut attributes = HashMap::new();
            for row_result in rows {
                let (attr_name, attr_value) = row_result?;
                attributes.insert(attr_name, attr_value);
            }
            
            result.push(ProductVariantDetail {
                variant: variant.clone(),
                attributes,
            });
        }
        
        Ok(result)
    }
    
    // Crear una nueva variante de producto
    pub fn create(pool: &DbPool, variant: NewProductVariant) -> SqliteResult<ProductVariant> {
        let mut conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el producto existe
        {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM products WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
            let count: i64 = stmt.query_row(params![variant.product_id], |row| row.get(0))?;
            
            if count == 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some("El producto especificado no existe".to_string()),
                ));
            }
        }
        
        // Verificar si ya existe una variante con el mismo SKU
        {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM product_variants WHERE sku = ?")?;
            let count: i64 = stmt.query_row(params![variant.sku], |row| row.get(0))?;
            
            if count > 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some("Ya existe una variante con ese SKU".to_string()),
                ));
            }
        }
        
        // Verificar que los valores de atributos existan
        for attribute_value_id in &variant.attribute_values {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM attribute_values WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
            let count: i64 = stmt.query_row(params![attribute_value_id], |row| row.get(0))?;
            
            if count == 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some(format!("El valor de atributo con ID {} no existe", attribute_value_id)),
                ));
            }
        }
        
        // Iniciar transacción
        let tx = conn.transaction()?;
        
        // Insertar la nueva variante de producto
        tx.execute(
            "INSERT INTO product_variants (product_id, sku, sale_price, cost_price, current_stock, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, 'Activo', strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'))",
            params![
                variant.product_id, 
                variant.sku, 
                variant.sale_price.unwrap_or(0.0), 
                variant.cost_price.unwrap_or(0.0), 
                variant.current_stock.unwrap_or(0.0)
            ],
        )?;
        
        let variant_id = tx.last_insert_rowid();
        
        // Insertar relaciones con valores de atributos
        for attribute_value_id in variant.attribute_values {
            tx.execute(
                "INSERT INTO variant_attribute_values (variant_id, attribute_value_id) VALUES (?, ?)",
                params![variant_id, attribute_value_id],
            )?;
        }
        
        // Confirmar transacción
        tx.commit()?;
        
        debug!("Variante de producto creada con ID: {}", variant_id);
        
        // Obtener la variante recién creada
        Self::find_by_id(pool, variant_id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar la variante de producto recién creada");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Actualizar una variante de producto existente
    pub fn update(pool: &DbPool, id: i64, update: UpdateProductVariant) -> SqliteResult<ProductVariant> {
        let mut conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si la variante existe
        let variant = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Variante de producto no encontrada para actualizar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Verificar unicidad del SKU si se está actualizando
        if let Some(sku) = &update.sku {
            if sku != &variant.sku {
                let mut stmt = conn.prepare("SELECT COUNT(*) FROM product_variants WHERE sku = ? AND id <> ?")?;
                let count: i64 = stmt.query_row(params![sku, id], |row| row.get(0))?;
                
                if count > 0 {
                    return Err(SqliteError::SqliteFailure(
                        rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                        Some("Ya existe una variante con ese SKU".to_string()),
                    ));
                }
            }
        }
        
        // Verificar que los valores de atributos existan (si se están actualizando)
        if let Some(attribute_values) = &update.attribute_values {
            for attribute_value_id in attribute_values {
                let mut stmt = conn.prepare("SELECT COUNT(*) FROM attribute_values WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
                let count: i64 = stmt.query_row(params![attribute_value_id], |row| row.get(0))?;
                
                if count == 0 {
                    return Err(SqliteError::SqliteFailure(
                        rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                        Some(format!("El valor de atributo con ID {} no existe", attribute_value_id)),
                    ));
                }
            }
        }
        
        // Iniciar transacción
        let tx = conn.transaction()?;
        
        // Construir la consulta de actualización
        let mut query = String::from("UPDATE product_variants SET ");
        let mut params_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(sku) = update.sku {
            query.push_str("sku = ?, ");
            params_values.push(Box::new(sku));
        }
        
        if let Some(sale_price) = update.sale_price {
            query.push_str("sale_price = ?, ");
            params_values.push(Box::new(sale_price));
        }
        
        if let Some(cost_price) = update.cost_price {
            query.push_str("cost_price = ?, ");
            params_values.push(Box::new(cost_price));
        }
        
        if let Some(current_stock) = update.current_stock {
            query.push_str("current_stock = ?, ");
            params_values.push(Box::new(current_stock));
        }
        
        if let Some(status) = update.status {
            query.push_str("status = ?, ");
            params_values.push(Box::new(status));
        }
        
        query.push_str("updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = ?");
        params_values.push(Box::new(id));
        
        let params_refs: Vec<&dyn rusqlite::ToSql> = params_values
            .iter()
            .map(|param| param.as_ref())
            .collect();
        
        tx.execute(&query, params_refs.as_slice())?;
        
        // Actualizar relaciones con valores de atributos (si se proporcionan)
        if let Some(attribute_values) = update.attribute_values {
            // Eliminar relaciones existentes
            tx.execute(
                "DELETE FROM variant_attribute_values WHERE variant_id = ?",
                params![id],
            )?;
            
            // Insertar nuevas relaciones
            for attribute_value_id in attribute_values {
                tx.execute(
                    "INSERT INTO variant_attribute_values (variant_id, attribute_value_id) VALUES (?, ?)",
                    params![id, attribute_value_id],
                )?;
            }
        }
        
        // Confirmar transacción
        tx.commit()?;
        
        // Obtener la variante actualizada
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar la variante de producto después de actualizar");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Eliminar una variante de producto (borrado lógico)
    pub fn delete(pool: &DbPool, id: i64, deleted_by: Option<String>) -> SqliteResult<()> {
        let mut conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si la variante existe
        let _variant = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Variante de producto no encontrada para eliminar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Verificar si tiene movimientos de inventario asociados
        {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM inventory_movements WHERE product_variant_id = ?")?;
            let count: i64 = stmt.query_row(params![id], |row| row.get(0))?;
            
            if count > 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some("No se puede eliminar la variante porque tiene movimientos de inventario asociados".to_string()),
                ));
            }
        }
        
        // Iniciar transacción
        let tx = conn.transaction()?;
        
        // Eliminar relaciones con valores de atributos
        tx.execute(
            "DELETE FROM variant_attribute_values WHERE variant_id = ?",
            params![id],
        )?;
        
        // Realizar el borrado lógico
        tx.execute(
            "UPDATE product_variants SET status = 'deleted', deleted_at = strftime('%Y-%m-%d %H:%M:%S', 'now'), deleted_by = ? WHERE id = ?",
            params![deleted_by, id],
        )?;
        
        // Confirmar transacción
        tx.commit()?;
        
        Ok(())
    }
    
    // Actualizar el stock de una variante
    pub fn update_stock(pool: &DbPool, id: i64, quantity: i64) -> SqliteResult<ProductVariant> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si la variante existe
        let variant = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Variante de producto no encontrada para actualizar stock");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Actualizar el stock
        conn.execute(
            "UPDATE product_variants SET current_stock = current_stock + ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = ?",
            params![quantity, id],
        )?;
        
        // Obtener la variante actualizada
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar la variante de producto después de actualizar el stock");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Obtener los valores de atributos de una variante
    pub fn get_attribute_values(pool: &DbPool, id: i64) -> SqliteResult<HashMap<String, String>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT a.name, av.value 
            FROM variant_attribute_values pva
            JOIN attribute_values av ON pva.attribute_value_id = av.id
            JOIN attributes a ON av.attribute_id = a.id
            WHERE pva.variant_id = ?"
        )?;
        
        let rows = stmt.query_map(params![id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })?;
        
        let mut attributes = HashMap::new();
        for row_result in rows {
            let (attr_name, attr_value) = row_result?;
            attributes.insert(attr_name, attr_value);
        }
        
        Ok(attributes)
    }
}