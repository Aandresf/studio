// src-backend-rust/src/models/transaction.rs

use crate::database_manager::DbPool;
use rusqlite::{params, Result as SqliteResult, Error as SqliteError};
use serde::{Deserialize, Serialize};
use log::{debug, error};
use std::collections::HashMap;
use chrono::{DateTime, Local, NaiveDateTime};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Transaction {
    pub id: i64,
    pub reference_number: String,
    pub transaction_type: String, // "sale" o "purchase"
    pub customer_supplier_id: Option<i64>,
    pub invoice_number: Option<String>,
    pub total: f64,
    pub payment_method: String,
    pub notes: Option<String>,
    pub status: String, // "completed", "pending", "annulled"
    pub user_id: i64,
    pub created_at: String,
    pub updated_at: String,
    pub annulled_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewTransaction {
    pub reference_number: String,
    pub transaction_type: String,
    pub customer_supplier_id: Option<i64>,
    pub invoice_number: Option<String>,
    pub total: f64,
    pub payment_method: String,
    pub notes: Option<String>,
    pub user_id: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TransactionItem {
    pub id: i64,
    pub transaction_id: i64,
    pub product_variant_id: i64,
    pub quantity: f64,
    pub price: f64,
    pub discount: Option<f64>,
    pub subtotal: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewTransactionItem {
    pub transaction_id: i64,
    pub product_variant_id: i64,
    pub quantity: f64,
    pub price: f64,
    pub discount: Option<f64>,
    pub subtotal: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TransactionDetail {
    pub transaction: Transaction,
    pub items: Vec<TransactionItemDetail>,
    pub customer_supplier_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TransactionItemDetail {
    pub item: TransactionItem,
    pub product_name: String,
    pub product_code: String,
    pub sku: String,
    pub attributes: HashMap<String, String>,
}

impl Transaction {
    // Buscar una transacción por ID
    pub fn find_by_id(pool: &DbPool, id: i64) -> SqliteResult<Option<Transaction>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, reference_number, transaction_type, customer_supplier_id, invoice_number, 
                    total, payment_method, notes, status, user_id, created_at, updated_at, annulled_at 
             FROM transactions 
             WHERE id = ?"
        )?;
        
        let rows = stmt.query_map(params![id], |row| {
            Ok(Transaction {
                id: row.get(0)?,
                reference_number: row.get(1)?,
                transaction_type: row.get(2)?,
                customer_supplier_id: row.get(3)?,
                invoice_number: row.get(4)?,
                total: row.get(5)?,
                payment_method: row.get(6)?,
                notes: row.get(7)?,
                status: row.get(8)?,
                user_id: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
                annulled_at: row.get(12)?,
            })
        })?;
        
        let mut transactions: Vec<Transaction> = Vec::new();
        for row in rows {
            transactions.push(row?);
        }
        
        if transactions.is_empty() {
            Ok(None)
        } else {
            Ok(Some(transactions[0].clone()))
        }
    }
    
    // Obtener todas las transacciones con paginación y filtros
    pub fn find_all(
        pool: &DbPool, 
        transaction_type: Option<String>,
        status: Option<String>,
        customer_supplier_id: Option<i64>,
        start_date: Option<String>,
        end_date: Option<String>,
        limit: Option<i64>, 
        offset: Option<i64>
    ) -> SqliteResult<Vec<Transaction>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut query = String::from(
            "SELECT id, reference_number, transaction_type, customer_supplier_id, invoice_number, 
                    total, payment_method, notes, status, user_id, created_at, updated_at, annulled_at 
             FROM transactions 
             WHERE 1=1"
        );
        
        let mut params_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        // Agregar filtros opcionales
        if let Some(t_type) = &transaction_type {
            query.push_str(" AND transaction_type = ?");
            params_values.push(Box::new(t_type.clone()));
        }
        
        if let Some(s) = &status {
            query.push_str(" AND status = ?");
            params_values.push(Box::new(s.clone()));
        }
        
        if let Some(cs_id) = customer_supplier_id {
            query.push_str(" AND customer_supplier_id = ?");
            params_values.push(Box::new(cs_id));
        }
        
        if let Some(start) = &start_date {
            query.push_str(" AND date(created_at) >= date(?)");
            params_values.push(Box::new(start.clone()));
        }
        
        if let Some(end) = &end_date {
            query.push_str(" AND date(created_at) <= date(?)");
            params_values.push(Box::new(end.clone()));
        }
        
        // Ordenar por fecha más reciente primero
        query.push_str(" ORDER BY created_at DESC");
        
        // Agregar paginación
        if let Some(limit_val) = limit {
            query.push_str(&format!(" LIMIT {}", limit_val));
            
            if let Some(offset_val) = offset {
                query.push_str(&format!(" OFFSET {}", offset_val));
            }
        }
        
        let mut stmt = conn.prepare(&query)?;
        
        let params_refs: Vec<&dyn rusqlite::ToSql> = params_values
            .iter()
            .map(|param| param.as_ref())
            .collect();
        
        let rows = stmt.query_map(params_refs.as_slice(), |row| {
            Ok(Transaction {
                id: row.get(0)?,
                reference_number: row.get(1)?,
                transaction_type: row.get(2)?,
                customer_supplier_id: row.get(3)?,
                invoice_number: row.get(4)?,
                total: row.get(5)?,
                payment_method: row.get(6)?,
                notes: row.get(7)?,
                status: row.get(8)?,
                user_id: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
                annulled_at: row.get(12)?,
            })
        })?;
        
        let mut transactions: Vec<Transaction> = Vec::new();
        for row in rows {
            transactions.push(row?);
        }
        
        Ok(transactions)
    }
    
    // Contar transacciones con filtros
    pub fn count_all(
        pool: &DbPool,
        transaction_type: Option<String>,
        status: Option<String>,
        customer_supplier_id: Option<i64>,
        start_date: Option<String>,
        end_date: Option<String>,
    ) -> SqliteResult<i64> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut query = String::from("SELECT COUNT(*) FROM transactions WHERE 1=1");
        
        let mut params_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        // Agregar filtros opcionales
        if let Some(t_type) = &transaction_type {
            query.push_str(" AND transaction_type = ?");
            params_values.push(Box::new(t_type.clone()));
        }
        
        if let Some(s) = &status {
            query.push_str(" AND status = ?");
            params_values.push(Box::new(s.clone()));
        }
        
        if let Some(cs_id) = customer_supplier_id {
            query.push_str(" AND customer_supplier_id = ?");
            params_values.push(Box::new(cs_id));
        }
        
        if let Some(start) = &start_date {
            query.push_str(" AND date(created_at) >= date(?)");
            params_values.push(Box::new(start.clone()));
        }
        
        if let Some(end) = &end_date {
            query.push_str(" AND date(created_at) <= date(?)");
            params_values.push(Box::new(end.clone()));
        }
        
        let mut stmt = conn.prepare(&query)?;
        
        let params_refs: Vec<&dyn rusqlite::ToSql> = params_values
            .iter()
            .map(|param| param.as_ref())
            .collect();
        
        let count: i64 = stmt.query_row(params_refs.as_slice(), |row| row.get(0))?;
        
        Ok(count)
    }
    
    // Crear una nueva transacción con sus items
    pub fn create_with_items(
        pool: &DbPool, 
        transaction: NewTransaction, 
        items: Vec<NewTransactionItem>
    ) -> SqliteResult<TransactionDetail> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el cliente/proveedor existe (si se proporciona)
        if let Some(cs_id) = transaction.customer_supplier_id {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM customers_suppliers WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
            let count: i64 = stmt.query_row(params![cs_id], |row| row.get(0))?;
            
            if count == 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some("El cliente o proveedor especificado no existe".to_string()),
                ));
            }
        }
        
        // Verificar si el usuario existe
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM users WHERE id = ?")?;
        let count: i64 = stmt.query_row(params![transaction.user_id], |row| row.get(0))?;
        
        if count == 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("El usuario especificado no existe".to_string()),
            ));
        }
        
        // Iniciar transacción en la base de datos
        let tx = conn.transaction()?;
        
        // Insertar la transacción principal
        tx.execute(
            "INSERT INTO transactions (reference_number, transaction_type, customer_supplier_id, invoice_number, 
                                     total, payment_method, notes, status, user_id, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'))",
            params![
                transaction.reference_number,
                transaction.transaction_type,
                transaction.customer_supplier_id,
                transaction.invoice_number,
                transaction.total,
                transaction.payment_method,
                transaction.notes,
                transaction.user_id
            ],
        )?;
        
        let transaction_id = tx.last_insert_rowid();
        
        // Insertar los items de la transacción y actualizar el inventario
        for item in &items {
            // Verificar si la variante de producto existe
            let mut stmt = tx.prepare("SELECT COUNT(*) FROM product_variants WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
            let count: i64 = stmt.query_row(params![item.product_variant_id], |row| row.get(0))?;
            
            if count == 0 {
                // Rollback implícito al dejar el ámbito sin commit
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some(format!("La variante de producto con ID {} no existe", item.product_variant_id)),
                ));
            }
            
            // Insertar el item
            tx.execute(
                "INSERT INTO transaction_items (transaction_id, product_variant_id, quantity, price, discount, subtotal, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'))",
                params![
                    transaction_id,
                    item.product_variant_id,
                    item.quantity,
                    item.price,
                    item.discount,
                    item.subtotal
                ],
            )?;
            
            // Actualizar el stock según el tipo de transacción
            let quantity_change: f64 = match transaction.transaction_type.as_str() {
                "purchase" => item.quantity, // Las compras aumentan el stock
                "sale" => -item.quantity,    // Las ventas reducen el stock
                _ => 0.0,                    // Tipo no reconocido, no cambia el stock
            };
            
            if quantity_change != 0.0 {
                // Actualizar el stock de la variante
                tx.execute(
                    "UPDATE product_variants 
                     SET stock = stock + ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') 
                     WHERE id = ?",
                    params![quantity_change, item.product_variant_id],
                )?;
                
                // Registrar el movimiento de inventario
                tx.execute(
                    "INSERT INTO inventory_movements 
                     (product_variant_id, quantity, movement_type, reference, user_id, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'))",
                    params![
                        item.product_variant_id,
                        quantity_change,
                        transaction.transaction_type,
                        format!("Ref: {}", transaction.reference_number),
                        transaction.user_id
                    ],
                )?;
            }
        }
        
        // Confirmar transacción
        tx.commit()?;
        
        // Obtener la transacción completa con sus detalles
        match Self::find_with_details(pool, transaction_id)? {
            Some(transaction_detail) => Ok(transaction_detail),
            None => Err(SqliteError::QueryReturnedNoRows),
        }
    }
    
    // Anular una transacción
    pub fn annul(pool: &DbPool, id: i64, user_id: i64) -> SqliteResult<Transaction> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si la transacción existe y no está anulada
        let transaction = match Self::find_by_id(pool, id)? {
            Some(t) => {
                if t.status == "annulled" {
                    return Err(SqliteError::SqliteFailure(
                        rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                        Some("La transacción ya está anulada".to_string()),
                    ));
                }
                t
            },
            None => return Err(SqliteError::QueryReturnedNoRows),
        };
        
        // Iniciar transacción en la base de datos
        let tx = conn.transaction()?;
        
        // Obtener los items de la transacción
        let mut stmt = tx.prepare(
            "SELECT id, product_variant_id, quantity 
             FROM transaction_items 
             WHERE transaction_id = ?"
        )?;
        
        let item_rows = stmt.query_map(params![id], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, f64>(2)?,
            ))
        })?;
        
        let mut items: Vec<(i64, i64, f64)> = Vec::new();
        for item_row in item_rows {
            items.push(item_row?);
        }
        
        // Revertir el efecto en el inventario
        for (_, product_variant_id, quantity) in &items {
            // El signo se invierte respecto al tipo de transacción original
            let quantity_change: f64 = match transaction.transaction_type.as_str() {
                "purchase" => -quantity, // Anular compra reduce el stock
                "sale" => *quantity,     // Anular venta aumenta el stock
                _ => 0.0,                // Tipo no reconocido, no cambia el stock
            };
            
            if quantity_change != 0.0 {
                // Actualizar el stock de la variante
                tx.execute(
                    "UPDATE product_variants 
                     SET stock = stock + ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') 
                     WHERE id = ?",
                    params![quantity_change, product_variant_id],
                )?;
                
                // Registrar el movimiento de inventario (anulación)
                tx.execute(
                    "INSERT INTO inventory_movements 
                     (product_variant_id, quantity, movement_type, reference, user_id, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'))",
                    params![
                        product_variant_id,
                        quantity_change,
                        format!("annul_{}", transaction.transaction_type),
                        format!("Anulación Ref: {}", transaction.reference_number),
                        user_id
                    ],
                )?;
            }
        }
        
        // Actualizar el estado de la transacción a anulada
        tx.execute(
            "UPDATE transactions 
             SET status = 'annulled', 
                 annulled_at = strftime('%Y-%m-%d %H:%M:%S', 'now'), 
                 updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') 
             WHERE id = ?",
            params![id],
        )?;
        
        // Confirmar transacción
        tx.commit()?;
        
        // Obtener la transacción actualizada
        match Self::find_by_id(pool, id)? {
            Some(t) => Ok(t),
            None => Err(SqliteError::QueryReturnedNoRows),
        }
    }
    
    // Obtener transacción con detalles completos
    pub fn find_with_details(pool: &DbPool, id: i64) -> SqliteResult<Option<TransactionDetail>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Obtener la transacción principal
        let transaction = match Self::find_by_id(pool, id)? {
            Some(t) => t,
            None => return Ok(None),
        };
        
        // Obtener nombre del cliente/proveedor si existe
        let mut customer_supplier_name: Option<String> = None;
        
        if let Some(cs_id) = transaction.customer_supplier_id {
            let mut stmt = conn.prepare("SELECT name FROM customers_suppliers WHERE id = ?")?;
            match stmt.query_row(params![cs_id], |row| row.get::<_, String>(0)) {
                Ok(name) => customer_supplier_name = Some(name),
                Err(_) => {} // Ignorar error si no se encuentra
            }
        }
        
        // Obtener los items de la transacción con detalles
        let mut items: Vec<TransactionItemDetail> = Vec::new();
        
        let mut stmt = conn.prepare(
            "SELECT 
                ti.id, ti.transaction_id, ti.product_variant_id, ti.quantity, 
                ti.price, ti.discount, ti.subtotal, ti.created_at, ti.updated_at,
                p.name, p.code, pv.sku
             FROM transaction_items ti
             JOIN product_variants pv ON ti.product_variant_id = pv.id
             JOIN products p ON pv.product_id = p.id
             WHERE ti.transaction_id = ?"
        )?;
        
        let item_rows = stmt.query_map(params![id], |row| {
            let item = TransactionItem {
                id: row.get(0)?,
                transaction_id: row.get(1)?,
                product_variant_id: row.get(2)?,
                quantity: row.get(3)?,
                price: row.get(4)?,
                discount: row.get(5)?,
                subtotal: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            };
            
            let product_name: String = row.get(9)?;
            let product_code: String = row.get(10)?;
            let sku: String = row.get(11)?;
            
            Ok((item, product_name, product_code, sku))
        })?;
        
        for item_row in item_rows {
            let (item, product_name, product_code, sku) = item_row?;
            
            // Obtener atributos de la variante
            let mut attr_stmt = conn.prepare(
                "SELECT a.name, av.value
                FROM product_variant_attributes pva
                JOIN attribute_values av ON pva.attribute_value_id = av.id
                JOIN attributes a ON av.attribute_id = a.id
                WHERE pva.product_variant_id = ?"
            )?;
            
            let attr_rows = attr_stmt.query_map(params![item.product_variant_id], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })?;
            
            let mut attributes = HashMap::new();
            for attr_row in attr_rows {
                let (attr_name, attr_value) = attr_row?;
                attributes.insert(attr_name, attr_value);
            }
            
            items.push(TransactionItemDetail {
                item,
                product_name,
                product_code,
                sku,
                attributes,
            });
        }
        
        Ok(Some(TransactionDetail {
            transaction,
            items,
            customer_supplier_name,
        }))
    }
}

impl TransactionItem {
    // Buscar items por ID de transacción
    pub fn find_by_transaction(pool: &DbPool, transaction_id: i64) -> SqliteResult<Vec<TransactionItem>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, transaction_id, product_variant_id, quantity, price, discount, subtotal, created_at, updated_at 
             FROM transaction_items 
             WHERE transaction_id = ?"
        )?;
        
        let rows = stmt.query_map(params![transaction_id], |row| {
            Ok(TransactionItem {
                id: row.get(0)?,
                transaction_id: row.get(1)?,
                product_variant_id: row.get(2)?,
                quantity: row.get(3)?,
                price: row.get(4)?,
                discount: row.get(5)?,
                subtotal: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        
        let mut items: Vec<TransactionItem> = Vec::new();
        for row in rows {
            items.push(row?);
        }
        
        Ok(items)
    }
}