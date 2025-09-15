// src-backend-rust/src/models/customer_supplier.rs

use crate::database_manager::DbPool;
use rusqlite::{params, Result as SqliteResult, Error as SqliteError};
use serde::{Deserialize, Serialize};
use log::{debug, error};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Customer {
    pub id: i64,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub rfc: Option<String>,
    pub notes: Option<String>,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewCustomer {
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub rfc: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCustomer {
    pub name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub rfc: Option<String>,
    pub notes: Option<String>,
    pub status: Option<String>,
}

impl Customer {
    // Buscar un cliente por ID
    pub fn find_by_id(pool: &DbPool, id: i64) -> SqliteResult<Option<Customer>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, email, phone, address, rfc, notes, status, deleted_at, deleted_by, created_at, updated_at 
            FROM customers 
            WHERE id = ? AND (status IS NULL OR status <> 'deleted')"
        )?;
        
        let rows = stmt.query_map(params![id], |row| {
            Ok(Customer {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                phone: row.get(3)?,
                address: row.get(4)?,
                rfc: row.get(5)?,
                notes: row.get(6)?,
                status: row.get(7)?,
                deleted_at: row.get(8)?,
                deleted_by: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;
        
        let mut customers: Vec<Customer> = Vec::new();
        for row in rows {
            customers.push(row?);
        }
        
        if customers.is_empty() {
            Ok(None)
        } else {
            Ok(Some(customers[0].clone()))
        }
    }
    
    // Obtener todos los clientes
    pub fn find_all(pool: &DbPool, limit: Option<i64>, offset: Option<i64>) -> SqliteResult<Vec<Customer>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut query = String::from(
            "SELECT id, name, email, phone, address, rfc, notes, status, deleted_at, deleted_by, created_at, updated_at 
            FROM customers 
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
            Ok(Customer {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                phone: row.get(3)?,
                address: row.get(4)?,
                rfc: row.get(5)?,
                notes: row.get(6)?,
                status: row.get(7)?,
                deleted_at: row.get(8)?,
                deleted_by: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;
        
        let mut customers: Vec<Customer> = Vec::new();
        for row in rows {
            customers.push(row?);
        }
        
        Ok(customers)
    }
    
    // Obtener el número total de clientes
    pub fn count_all(pool: &DbPool) -> SqliteResult<i64> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT COUNT(*) FROM customers WHERE (status IS NULL OR status <> 'deleted')"
        )?;
        
        let count: i64 = stmt.query_row(params![], |row| row.get(0))?;
        
        Ok(count)
    }
    
    // Crear un nuevo cliente
    pub fn create(pool: &DbPool, customer: NewCustomer) -> SqliteResult<Customer> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        conn.execute(
            "INSERT INTO customers (name, email, phone, address, rfc, notes, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, 'Activo', strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'))",
            params![
                customer.name, 
                customer.email, 
                customer.phone, 
                customer.address, 
                customer.rfc, 
                customer.notes
            ],
        )?;
        
        let id = conn.last_insert_rowid();
        debug!("Cliente creado con ID: {}", id);
        
        // Obtener el cliente recién creado
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar el cliente recién creado");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Actualizar un cliente existente
    pub fn update(pool: &DbPool, id: i64, update: UpdateCustomer) -> SqliteResult<Customer> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el cliente existe
        let _customer = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Cliente no encontrado para actualizar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Construir la consulta de actualización
        let mut query = String::from("UPDATE customers SET ");
        let mut params_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(name) = update.name {
            query.push_str("name = ?, ");
            params_values.push(Box::new(name));
        }
        
        if let Some(email) = update.email {
            query.push_str("email = ?, ");
            params_values.push(Box::new(email));
        }
        
        if let Some(phone) = update.phone {
            query.push_str("phone = ?, ");
            params_values.push(Box::new(phone));
        }
        
        if let Some(address) = update.address {
            query.push_str("address = ?, ");
            params_values.push(Box::new(address));
        }
        
        if let Some(rfc) = update.rfc {
            query.push_str("rfc = ?, ");
            params_values.push(Box::new(rfc));
        }
        
        if let Some(notes) = update.notes {
            query.push_str("notes = ?, ");
            params_values.push(Box::new(notes));
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
        
        // Obtener el cliente actualizado
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar el cliente después de actualizar");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Eliminar un cliente (borrado lógico)
    pub fn delete(pool: &DbPool, id: i64, deleted_by: Option<String>) -> SqliteResult<()> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el cliente existe
        let _customer = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Cliente no encontrado para eliminar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Realizar el borrado lógico
        conn.execute(
            "UPDATE customers SET status = 'deleted', deleted_at = strftime('%Y-%m-%d %H:%M:%S', 'now'), deleted_by = ? WHERE id = ?",
            params![deleted_by, id],
        )?;
        
        Ok(())
    }
    
    // Buscar clientes por nombre (búsqueda parcial)
    pub fn search_by_name(pool: &DbPool, name: &str) -> SqliteResult<Vec<Customer>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let search_pattern = format!("%{}%", name);
        
        let mut stmt = conn.prepare(
            "SELECT id, name, email, phone, address, rfc, notes, status, deleted_at, deleted_by, created_at, updated_at 
            FROM customers 
            WHERE (status IS NULL OR status <> 'deleted') AND name LIKE ?
            ORDER BY name ASC"
        )?;
        
        let rows = stmt.query_map(params![search_pattern], |row| {
            Ok(Customer {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                phone: row.get(3)?,
                address: row.get(4)?,
                rfc: row.get(5)?,
                notes: row.get(6)?,
                status: row.get(7)?,
                deleted_at: row.get(8)?,
                deleted_by: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;
        
        let mut customers: Vec<Customer> = Vec::new();
        for row in rows {
            customers.push(row?);
        }
        
        Ok(customers)
    }
}

// Modelo para proveedores
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Supplier {
    pub id: i64,
    pub name: String,
    pub contact_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub rfc: Option<String>,
    pub notes: Option<String>,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewSupplier {
    pub name: String,
    pub contact_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub rfc: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateSupplier {
    pub name: Option<String>,
    pub contact_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub rfc: Option<String>,
    pub notes: Option<String>,
    pub status: Option<String>,
}

impl Supplier {
    // Buscar un proveedor por ID
    pub fn find_by_id(pool: &DbPool, id: i64) -> SqliteResult<Option<Supplier>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, contact_name, email, phone, address, rfc, notes, status, deleted_at, deleted_by, created_at, updated_at 
            FROM suppliers 
            WHERE id = ? AND (status IS NULL OR status <> 'deleted')"
        )?;
        
        let rows = stmt.query_map(params![id], |row| {
            Ok(Supplier {
                id: row.get(0)?,
                name: row.get(1)?,
                contact_name: row.get(2)?,
                email: row.get(3)?,
                phone: row.get(4)?,
                address: row.get(5)?,
                rfc: row.get(6)?,
                notes: row.get(7)?,
                status: row.get(8)?,
                deleted_at: row.get(9)?,
                deleted_by: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })?;
        
        let mut suppliers: Vec<Supplier> = Vec::new();
        for row in rows {
            suppliers.push(row?);
        }
        
        if suppliers.is_empty() {
            Ok(None)
        } else {
            Ok(Some(suppliers[0].clone()))
        }
    }
    
    // Obtener todos los proveedores
    pub fn find_all(pool: &DbPool, limit: Option<i64>, offset: Option<i64>) -> SqliteResult<Vec<Supplier>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut query = String::from(
            "SELECT id, name, contact_name, email, phone, address, rfc, notes, status, deleted_at, deleted_by, created_at, updated_at 
            FROM suppliers 
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
            Ok(Supplier {
                id: row.get(0)?,
                name: row.get(1)?,
                contact_name: row.get(2)?,
                email: row.get(3)?,
                phone: row.get(4)?,
                address: row.get(5)?,
                rfc: row.get(6)?,
                notes: row.get(7)?,
                status: row.get(8)?,
                deleted_at: row.get(9)?,
                deleted_by: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })?;
        
        let mut suppliers: Vec<Supplier> = Vec::new();
        for row in rows {
            suppliers.push(row?);
        }
        
        Ok(suppliers)
    }
    
    // Obtener el número total de proveedores
    pub fn count_all(pool: &DbPool) -> SqliteResult<i64> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT COUNT(*) FROM suppliers WHERE (status IS NULL OR status <> 'deleted')"
        )?;
        
        let count: i64 = stmt.query_row(params![], |row| row.get(0))?;
        
        Ok(count)
    }
    
    // Crear un nuevo proveedor
    pub fn create(pool: &DbPool, supplier: NewSupplier) -> SqliteResult<Supplier> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        conn.execute(
            "INSERT INTO suppliers (name, contact_name, email, phone, address, rfc, notes, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo', strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'))",
            params![
                supplier.name, 
                supplier.contact_name, 
                supplier.email, 
                supplier.phone, 
                supplier.address, 
                supplier.rfc, 
                supplier.notes
            ],
        )?;
        
        let id = conn.last_insert_rowid();
        debug!("Proveedor creado con ID: {}", id);
        
        // Obtener el proveedor recién creado
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar el proveedor recién creado");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Actualizar un proveedor existente
    pub fn update(pool: &DbPool, id: i64, update: UpdateSupplier) -> SqliteResult<Supplier> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el proveedor existe
        let _supplier = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Proveedor no encontrado para actualizar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Construir la consulta de actualización
        let mut query = String::from("UPDATE suppliers SET ");
        let mut params_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(name) = update.name {
            query.push_str("name = ?, ");
            params_values.push(Box::new(name));
        }
        
        if let Some(contact_name) = update.contact_name {
            query.push_str("contact_name = ?, ");
            params_values.push(Box::new(contact_name));
        }
        
        if let Some(email) = update.email {
            query.push_str("email = ?, ");
            params_values.push(Box::new(email));
        }
        
        if let Some(phone) = update.phone {
            query.push_str("phone = ?, ");
            params_values.push(Box::new(phone));
        }
        
        if let Some(address) = update.address {
            query.push_str("address = ?, ");
            params_values.push(Box::new(address));
        }
        
        if let Some(rfc) = update.rfc {
            query.push_str("rfc = ?, ");
            params_values.push(Box::new(rfc));
        }
        
        if let Some(notes) = update.notes {
            query.push_str("notes = ?, ");
            params_values.push(Box::new(notes));
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
        
        // Obtener el proveedor actualizado
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar el proveedor después de actualizar");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Eliminar un proveedor (borrado lógico)
    pub fn delete(pool: &DbPool, id: i64, deleted_by: Option<String>) -> SqliteResult<()> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el proveedor existe
        let _supplier = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Proveedor no encontrado para eliminar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Realizar el borrado lógico
        conn.execute(
            "UPDATE suppliers SET status = 'deleted', deleted_at = strftime('%Y-%m-%d %H:%M:%S', 'now'), deleted_by = ? WHERE id = ?",
            params![deleted_by, id],
        )?;
        
        Ok(())
    }
    
    // Buscar proveedores por nombre (búsqueda parcial)
    pub fn search_by_name(pool: &DbPool, name: &str) -> SqliteResult<Vec<Supplier>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let search_pattern = format!("%{}%", name);
        
        let mut stmt = conn.prepare(
            "SELECT id, name, contact_name, email, phone, address, rfc, notes, status, deleted_at, deleted_by, created_at, updated_at 
            FROM suppliers 
            WHERE (status IS NULL OR status <> 'deleted') AND name LIKE ?
            ORDER BY name ASC"
        )?;
        
        let rows = stmt.query_map(params![search_pattern], |row| {
            Ok(Supplier {
                id: row.get(0)?,
                name: row.get(1)?,
                contact_name: row.get(2)?,
                email: row.get(3)?,
                phone: row.get(4)?,
                address: row.get(5)?,
                rfc: row.get(6)?,
                notes: row.get(7)?,
                status: row.get(8)?,
                deleted_at: row.get(9)?,
                deleted_by: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })?;
        
        let mut suppliers: Vec<Supplier> = Vec::new();
        for row in rows {
            suppliers.push(row?);
        }
        
        Ok(suppliers)
    }
}