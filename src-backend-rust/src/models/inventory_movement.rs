// src-backend-rust/src/models/inventory_movement.rs

use crate::database_manager::DbPool;
use rusqlite::{params, Result as SqliteResult, Error as SqliteError};
use serde::{Deserialize, Serialize};
use log::{debug, error};
use chrono::{DateTime, Local, NaiveDateTime};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InventoryMovement {
    pub id: i64,
    pub product_variant_id: i64,
    pub quantity: i64,
    pub movement_type: String,
    pub reference: Option<String>,
    pub notes: Option<String>,
    pub user_id: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewInventoryMovement {
    pub product_variant_id: i64,
    pub quantity: i64,
    pub movement_type: String,
    pub reference: Option<String>,
    pub notes: Option<String>,
    pub user_id: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InventoryMovementDetail {
    pub movement: InventoryMovement,
    pub product_name: String,
    pub product_code: String,
    pub sku: String,
    pub username: String,
    pub attributes: HashMap<String, String>,
}

impl InventoryMovement {
    // Buscar un movimiento de inventario por ID
    pub fn find_by_id(pool: &DbPool, id: i64) -> SqliteResult<Option<InventoryMovement>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, product_variant_id, quantity, movement_type, reference, notes, user_id, created_at, updated_at 
            FROM inventory_movements 
            WHERE id = ?"
        )?;
        
        let rows = stmt.query_map(params![id], |row| {
            Ok(InventoryMovement {
                id: row.get(0)?,
                product_variant_id: row.get(1)?,
                quantity: row.get(2)?,
                movement_type: row.get(3)?,
                reference: row.get(4)?,
                notes: row.get(5)?,
                user_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        
        let mut movements: Vec<InventoryMovement> = Vec::new();
        for row in rows {
            movements.push(row?);
        }
        
        if movements.is_empty() {
            Ok(None)
        } else {
            Ok(Some(movements[0].clone()))
        }
    }
    
    // Obtener todos los movimientos de inventario
    pub fn find_all(pool: &DbPool, limit: Option<i64>, offset: Option<i64>) -> SqliteResult<Vec<InventoryMovement>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut query = String::from(
            "SELECT id, product_variant_id, quantity, movement_type, reference, notes, user_id, created_at, updated_at 
            FROM inventory_movements 
            ORDER BY created_at DESC"
        );
        
        if let Some(limit_val) = limit {
            query.push_str(&format!(" LIMIT {}", limit_val));
            
            if let Some(offset_val) = offset {
                query.push_str(&format!(" OFFSET {}", offset_val));
            }
        }
        
        let mut stmt = conn.prepare(&query)?;
        
        let rows = stmt.query_map(params![], |row| {
            Ok(InventoryMovement {
                id: row.get(0)?,
                product_variant_id: row.get(1)?,
                quantity: row.get(2)?,
                movement_type: row.get(3)?,
                reference: row.get(4)?,
                notes: row.get(5)?,
                user_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        
        let mut movements: Vec<InventoryMovement> = Vec::new();
        for row in rows {
            movements.push(row?);
        }
        
        Ok(movements)
    }
    
    // Obtener el número total de movimientos de inventario
    pub fn count_all(pool: &DbPool) -> SqliteResult<i64> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM inventory_movements")?;
        
        let count: i64 = stmt.query_row(params![], |row| row.get(0))?;
        
        Ok(count)
    }
    
    // Obtener movimientos de inventario por variante de producto
    pub fn find_by_product_variant(pool: &DbPool, product_variant_id: i64) -> SqliteResult<Vec<InventoryMovement>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, product_variant_id, quantity, movement_type, reference, notes, user_id, created_at, updated_at 
            FROM inventory_movements 
            WHERE product_variant_id = ?
            ORDER BY created_at DESC"
        )?;
        
        let rows = stmt.query_map(params![product_variant_id], |row| {
            Ok(InventoryMovement {
                id: row.get(0)?,
                product_variant_id: row.get(1)?,
                quantity: row.get(2)?,
                movement_type: row.get(3)?,
                reference: row.get(4)?,
                notes: row.get(5)?,
                user_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        
        let mut movements: Vec<InventoryMovement> = Vec::new();
        for row in rows {
            movements.push(row?);
        }
        
        Ok(movements)
    }
    
    // Obtener movimientos de inventario por producto
    pub fn find_by_product(pool: &DbPool, product_id: i64) -> SqliteResult<Vec<InventoryMovement>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT im.id, im.product_variant_id, im.quantity, im.movement_type, im.reference, im.notes, im.user_id, im.created_at, im.updated_at 
            FROM inventory_movements im
            JOIN product_variants pv ON im.product_variant_id = pv.id
            WHERE pv.product_id = ?
            ORDER BY im.created_at DESC"
        )?;
        
        let rows = stmt.query_map(params![product_id], |row| {
            Ok(InventoryMovement {
                id: row.get(0)?,
                product_variant_id: row.get(1)?,
                quantity: row.get(2)?,
                movement_type: row.get(3)?,
                reference: row.get(4)?,
                notes: row.get(5)?,
                user_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        
        let mut movements: Vec<InventoryMovement> = Vec::new();
        for row in rows {
            movements.push(row?);
        }
        
        Ok(movements)
    }
    
    // Obtener movimientos de inventario por usuario
    pub fn find_by_user(pool: &DbPool, user_id: i64) -> SqliteResult<Vec<InventoryMovement>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, product_variant_id, quantity, movement_type, reference, notes, user_id, created_at, updated_at 
            FROM inventory_movements 
            WHERE user_id = ?
            ORDER BY created_at DESC"
        )?;
        
        let rows = stmt.query_map(params![user_id], |row| {
            Ok(InventoryMovement {
                id: row.get(0)?,
                product_variant_id: row.get(1)?,
                quantity: row.get(2)?,
                movement_type: row.get(3)?,
                reference: row.get(4)?,
                notes: row.get(5)?,
                user_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        
        let mut movements: Vec<InventoryMovement> = Vec::new();
        for row in rows {
            movements.push(row?);
        }
        
        Ok(movements)
    }
    
    // Obtener movimientos de inventario por rango de fechas
    pub fn find_by_date_range(pool: &DbPool, start_date: &str, end_date: &str) -> SqliteResult<Vec<InventoryMovement>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, product_variant_id, quantity, movement_type, reference, notes, user_id, created_at, updated_at 
            FROM inventory_movements 
            WHERE date(created_at) BETWEEN date(?) AND date(?)
            ORDER BY created_at DESC"
        )?;
        
        let rows = stmt.query_map(params![start_date, end_date], |row| {
            Ok(InventoryMovement {
                id: row.get(0)?,
                product_variant_id: row.get(1)?,
                quantity: row.get(2)?,
                movement_type: row.get(3)?,
                reference: row.get(4)?,
                notes: row.get(5)?,
                user_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        
        let mut movements: Vec<InventoryMovement> = Vec::new();
        for row in rows {
            movements.push(row?);
        }
        
        Ok(movements)
    }
    
    // Crear un nuevo movimiento de inventario
    pub fn create(pool: &DbPool, movement: NewInventoryMovement) -> SqliteResult<InventoryMovement> {
        let mut conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si la variante de producto existe
        {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM product_variants WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
            let count: i64 = stmt.query_row(params![movement.product_variant_id], |row| row.get(0))?;
            
            if count == 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some("La variante de producto especificada no existe".to_string()),
                ));
            }
        }
        
        // Verificar si el usuario existe
        {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM users WHERE id = ?")?;
            let count: i64 = stmt.query_row(params![movement.user_id], |row| row.get(0))?;
            
            if count == 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some("El usuario especificado no existe".to_string()),
                ));
            }
        }
        
        // Iniciar transacción
        let tx = conn.transaction()?;
        
        // Insertar el nuevo movimiento de inventario
        tx.execute(
            "INSERT INTO inventory_movements (product_variant_id, quantity, movement_type, reference, notes, user_id, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'))",
            params![
                movement.product_variant_id, 
                movement.quantity, 
                movement.movement_type, 
                movement.reference, 
                movement.notes, 
                movement.user_id
            ],
        )?;
        
        let id = tx.last_insert_rowid();
        
        // Actualizar el stock de la variante de producto
        tx.execute(
            "UPDATE product_variants SET stock = stock + ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = ?",
            params![movement.quantity, movement.product_variant_id],
        )?;
        
        // Confirmar transacción
        tx.commit()?;
        
        debug!("Movimiento de inventario creado con ID: {}", id);
        
        // Obtener el movimiento recién creado
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar el movimiento de inventario recién creado");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Obtener detalles de un movimiento de inventario
    pub fn find_with_details(pool: &DbPool, id: i64) -> SqliteResult<Option<InventoryMovementDetail>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Obtener el movimiento principal
        let movement = match Self::find_by_id(pool, id)? {
            Some(m) => m,
            None => return Ok(None),
        };
        
        // Obtener información del producto y variante
        let mut stmt = conn.prepare(
            "SELECT p.name, p.code, pv.sku
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            WHERE pv.id = ?"
        )?;
        
        let (product_name, product_code, sku): (String, String, String) = stmt.query_row(params![movement.product_variant_id], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })?;
        
        // Obtener información del usuario
        let mut stmt = conn.prepare("SELECT username FROM users WHERE id = ?")?;
        let username: String = stmt.query_row(params![movement.user_id], |row| row.get(0))?;
        
        // Obtener atributos de la variante
        let mut stmt = conn.prepare(
            "SELECT a.name, av.value
            FROM product_variant_attributes pva
            JOIN attribute_values av ON pva.attribute_value_id = av.id
            JOIN attributes a ON av.attribute_id = a.id
            WHERE pva.product_variant_id = ?"
        )?;
        
        let rows = stmt.query_map(params![movement.product_variant_id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })?;
        
        let mut attributes = HashMap::new();
        for row_result in rows {
            let (attr_name, attr_value) = row_result?;
            attributes.insert(attr_name, attr_value);
        }
        
        Ok(Some(InventoryMovementDetail {
            movement,
            product_name,
            product_code,
            sku,
            username,
            attributes,
        }))
    }
    
    // Obtener movimientos detallados con paginación y filtros opcionales
    pub fn find_with_details_paginated(
        pool: &DbPool, 
        limit: Option<i64>, 
        offset: Option<i64>,
        product_id: Option<i64>,
        movement_type: Option<String>,
        start_date: Option<String>,
        end_date: Option<String>,
    ) -> SqliteResult<Vec<InventoryMovementDetail>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Construir consulta base
        let mut query = String::from(
            "SELECT 
                im.id, im.product_variant_id, im.quantity, im.movement_type, 
                im.reference, im.notes, im.user_id, im.created_at, im.updated_at,
                p.name, p.code, pv.sku, u.username
            FROM inventory_movements im
            JOIN product_variants pv ON im.product_variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            JOIN users u ON im.user_id = u.id
            WHERE 1=1"
        );
        
        let mut params_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        // Agregar filtros opcionales
        if let Some(prod_id) = product_id {
            query.push_str(" AND pv.product_id = ?");
            params_values.push(Box::new(prod_id));
        }
        
        if let Some(mov_type) = movement_type {
            query.push_str(" AND im.movement_type = ?");
            params_values.push(Box::new(mov_type));
        }
        
        if let Some(start) = &start_date {
            query.push_str(" AND date(im.created_at) >= date(?)");
            params_values.push(Box::new(start.clone()));
        }
        
        if let Some(end) = &end_date {
            query.push_str(" AND date(im.created_at) <= date(?)");
            params_values.push(Box::new(end.clone()));
        }
        
        // Ordenar por fecha más reciente primero
        query.push_str(" ORDER BY im.created_at DESC");
        
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
            let movement = InventoryMovement {
                id: row.get(0)?,
                product_variant_id: row.get(1)?,
                quantity: row.get(2)?,
                movement_type: row.get(3)?,
                reference: row.get(4)?,
                notes: row.get(5)?,
                user_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            };
            
            let product_name: String = row.get(9)?;
            let product_code: String = row.get(10)?;
            let sku: String = row.get(11)?;
            let username: String = row.get(12)?;
            
            Ok((movement, product_name, product_code, sku, username))
        })?;
        
        let mut result: Vec<InventoryMovementDetail> = Vec::new();
        
        for row in rows {
            let (movement, product_name, product_code, sku, username) = row?;
            
            // Obtener atributos de la variante
            let mut attr_stmt = conn.prepare(
                "SELECT a.name, av.value
                FROM product_variant_attributes pva
                JOIN attribute_values av ON pva.attribute_value_id = av.id
                JOIN attributes a ON av.attribute_id = a.id
                WHERE pva.product_variant_id = ?"
            )?;
            
            let attr_rows = attr_stmt.query_map(params![movement.product_variant_id], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })?;
            
            let mut attributes = HashMap::new();
            for attr_row in attr_rows {
                let (attr_name, attr_value) = attr_row?;
                attributes.insert(attr_name, attr_value);
            }
            
            result.push(InventoryMovementDetail {
                movement,
                product_name,
                product_code,
                sku,
                username,
                attributes,
            });
        }
        
        Ok(result)
    }
    
    // Contar movimientos con filtros opcionales
    pub fn count_with_filters(
        pool: &DbPool,
        product_id: Option<i64>,
        movement_type: Option<String>,
        start_date: Option<String>,
        end_date: Option<String>,
    ) -> SqliteResult<i64> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Construir consulta base
        let mut query = String::from(
            "SELECT COUNT(*)
            FROM inventory_movements im
            JOIN product_variants pv ON im.product_variant_id = pv.id
            WHERE 1=1"
        );
        
        let mut params_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        // Agregar filtros opcionales
        if let Some(prod_id) = product_id {
            query.push_str(" AND pv.product_id = ?");
            params_values.push(Box::new(prod_id));
        }
        
        if let Some(mov_type) = movement_type {
            query.push_str(" AND im.movement_type = ?");
            params_values.push(Box::new(mov_type));
        }
        
        if let Some(start) = &start_date {
            query.push_str(" AND date(im.created_at) >= date(?)");
            params_values.push(Box::new(start.clone()));
        }
        
        if let Some(end) = &end_date {
            query.push_str(" AND date(im.created_at) <= date(?)");
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
    
    // Obtener resumen por tipo de movimiento para un período específico
    pub fn get_movement_summary(
        pool: &DbPool,
        start_date: Option<String>,
        end_date: Option<String>,
    ) -> SqliteResult<Vec<(String, i64, i64)>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Construir consulta base
        let mut query = String::from(
            "SELECT 
                movement_type,
                COUNT(*) as movement_count,
                SUM(quantity) as total_quantity
            FROM inventory_movements
            WHERE 1=1"
        );
        
        let mut params_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        // Agregar filtros opcionales de fecha
        if let Some(start) = &start_date {
            query.push_str(" AND date(created_at) >= date(?)");
            params_values.push(Box::new(start.clone()));
        }
        
        if let Some(end) = &end_date {
            query.push_str(" AND date(created_at) <= date(?)");
            params_values.push(Box::new(end.clone()));
        }
        
        // Agrupar por tipo de movimiento
        query.push_str(" GROUP BY movement_type");
        
        let mut stmt = conn.prepare(&query)?;
        
        let params_refs: Vec<&dyn rusqlite::ToSql> = params_values
            .iter()
            .map(|param| param.as_ref())
            .collect();
        
        let rows = stmt.query_map(params_refs.as_slice(), |row| {
            let movement_type: String = row.get(0)?;
            let movement_count: i64 = row.get(1)?;
            let total_quantity: i64 = row.get(2)?;
            
            Ok((movement_type, movement_count, total_quantity))
        })?;
        
        let mut result: Vec<(String, i64, i64)> = Vec::new();
        for row in rows {
            result.push(row?);
        }
        
        Ok(result)
    }
    
    // Exportar movimientos a CSV
    pub fn export_to_csv(
        pool: &DbPool,
        product_id: Option<i64>,
        movement_type: Option<String>,
        start_date: Option<String>,
        end_date: Option<String>,
    ) -> SqliteResult<String> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Construir consulta base
        let mut query = String::from(
            "SELECT 
                im.id, im.created_at, p.code, p.name, pv.sku, 
                im.quantity, im.movement_type, u.username, 
                im.reference, im.notes
            FROM inventory_movements im
            JOIN product_variants pv ON im.product_variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            JOIN users u ON im.user_id = u.id
            WHERE 1=1"
        );
        
        let mut params_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        // Agregar filtros opcionales
        if let Some(prod_id) = product_id {
            query.push_str(" AND pv.product_id = ?");
            params_values.push(Box::new(prod_id));
        }
        
        if let Some(mov_type) = movement_type {
            query.push_str(" AND im.movement_type = ?");
            params_values.push(Box::new(mov_type));
        }
        
        if let Some(start) = &start_date {
            query.push_str(" AND date(im.created_at) >= date(?)");
            params_values.push(Box::new(start.clone()));
        }
        
        if let Some(end) = &end_date {
            query.push_str(" AND date(im.created_at) <= date(?)");
            params_values.push(Box::new(end.clone()));
        }
        
        // Ordenar por fecha
        query.push_str(" ORDER BY im.created_at DESC");
        
        let mut stmt = conn.prepare(&query)?;
        
        let params_refs: Vec<&dyn rusqlite::ToSql> = params_values
            .iter()
            .map(|param| param.as_ref())
            .collect();
        
        let rows = stmt.query_map(params_refs.as_slice(), |row| {
            let id: i64 = row.get(0)?;
            let created_at: String = row.get(1)?;
            let product_code: String = row.get(2)?;
            let product_name: String = row.get(3)?;
            let sku: String = row.get(4)?;
            let quantity: i64 = row.get(5)?;
            let movement_type: String = row.get(6)?;
            let username: String = row.get(7)?;
            let reference: Option<String> = row.get(8)?;
            let notes: Option<String> = row.get(9)?;
            
            Ok((id, created_at, product_code, product_name, sku, quantity, movement_type, username, reference, notes))
        })?;
        
        // Crear contenido CSV
        let mut csv_content = String::from("ID,Fecha,Código,Producto,SKU,Cantidad,Tipo,Usuario,Referencia,Notas\n");
        
        for row in rows {
            let (id, created_at, product_code, product_name, sku, quantity, movement_type, username, reference, notes) = row?;
            
            // Escapar campos que podrían contener comas
            let product_name_escaped = format!("\"{}\"", product_name.replace("\"", "\"\""));
            let reference_escaped = match reference {
                Some(ref_val) => format!("\"{}\"", ref_val.replace("\"", "\"\"")),
                None => String::from(""),
            };
            let notes_escaped = match notes {
                Some(notes_val) => format!("\"{}\"", notes_val.replace("\"", "\"\"")),
                None => String::from(""),
            };
            
            csv_content.push_str(&format!(
                "{},{},{},{},{},{},{},{},{},{}\n",
                id, created_at, product_code, product_name_escaped, sku, 
                quantity, movement_type, username, reference_escaped, notes_escaped
            ));
        }
        
        Ok(csv_content)
    }
}