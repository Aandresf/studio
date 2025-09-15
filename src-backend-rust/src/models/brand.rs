// src-backend-rust/src/models/brand.rs

use crate::database_manager::DbPool;
use rusqlite::{params, Result as SqliteResult, Error as SqliteError};
use serde::{Deserialize, Serialize};
use log::{debug, error};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Brand {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub subdepartment_id: Option<i64>,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewBrand {
    pub name: String,
    pub description: Option<String>,
    pub subdepartment_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateBrand {
    pub name: Option<String>,
    pub description: Option<String>,
    pub subdepartment_id: Option<i64>,
    pub status: Option<String>,
}

impl Brand {
    // Buscar una marca por ID
    pub fn find_by_id(pool: &DbPool, id: i64) -> SqliteResult<Option<Brand>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, description, subdepartment_id, status, deleted_at, deleted_by, created_at, updated_at 
            FROM brands 
            WHERE id = ? AND (status IS NULL OR status <> 'deleted')"
        )?;
        
        let rows = stmt.query_map(params![id], |row| {
            Ok(Brand {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                subdepartment_id: row.get(3)?,
                status: row.get(4)?,
                deleted_at: row.get(5)?,
                deleted_by: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        
        let mut brands: Vec<Brand> = Vec::new();
        for row in rows {
            brands.push(row?);
        }
        
        if brands.is_empty() {
            Ok(None)
        } else {
            Ok(Some(brands[0].clone()))
        }
    }
    
    // Obtener todas las marcas
    pub fn find_all(pool: &DbPool) -> SqliteResult<Vec<Brand>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, description, subdepartment_id, status, deleted_at, deleted_by, created_at, updated_at 
            FROM brands 
            WHERE (status IS NULL OR status <> 'deleted')
            ORDER BY name ASC"
        )?;
        
        let rows = stmt.query_map(params![], |row| {
            Ok(Brand {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                subdepartment_id: row.get(3)?,
                status: row.get(4)?,
                deleted_at: row.get(5)?,
                deleted_by: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        
        let mut brands: Vec<Brand> = Vec::new();
        for row in rows {
            brands.push(row?);
        }
        
        Ok(brands)
    }
    
    // Filtrar marcas por subdepartamento
    pub fn find_by_subdepartment(pool: &DbPool, subdepartment_id: i64) -> SqliteResult<Vec<Brand>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, description, subdepartment_id, status, deleted_at, deleted_by, created_at, updated_at 
            FROM brands 
            WHERE (status IS NULL OR status <> 'deleted') AND subdepartment_id = ?
            ORDER BY name ASC"
        )?;
        
        let rows = stmt.query_map(params![subdepartment_id], |row| {
            Ok(Brand {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                subdepartment_id: row.get(3)?,
                status: row.get(4)?,
                deleted_at: row.get(5)?,
                deleted_by: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        
        let mut brands: Vec<Brand> = Vec::new();
        for row in rows {
            brands.push(row?);
        }
        
        Ok(brands)
    }
    
    // Crear una nueva marca
    pub fn create(pool: &DbPool, brand: NewBrand) -> SqliteResult<Brand> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si ya existe una marca con el mismo nombre
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM brands WHERE name = ?")?;
        let count: i64 = stmt.query_row(params![brand.name], |row| row.get(0))?;
        
        if count > 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("Ya existe una marca con ese nombre".to_string()),
            ));
        }
        
        // Verificar si el subdepartamento existe (si se proporciona)
        if let Some(subdepartment_id) = brand.subdepartment_id {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM subdepartments WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
            let count: i64 = stmt.query_row(params![subdepartment_id], |row| row.get(0))?;
            
            if count == 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some("El subdepartamento especificado no existe".to_string()),
                ));
            }
        }
        
        // Insertar la nueva marca
        conn.execute(
            "INSERT INTO brands (name, description, subdepartment_id, status, created_at, updated_at) 
            VALUES (?, ?, ?, 'Activo', strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'))",
            params![brand.name, brand.description, brand.subdepartment_id],
        )?;
        
        let id = conn.last_insert_rowid();
        debug!("Marca creada con ID: {}", id);
        
        // Obtener la marca recién creada
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar la marca recién creada");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Actualizar una marca existente
    pub fn update(pool: &DbPool, id: i64, update: UpdateBrand) -> SqliteResult<Brand> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si la marca existe
        let brand = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Marca no encontrada para actualizar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Verificar unicidad del nombre si se está actualizando
        if let Some(name) = &update.name {
            if name != &brand.name {
                let mut stmt = conn.prepare("SELECT COUNT(*) FROM brands WHERE name = ? AND id <> ?")?;
                let count: i64 = stmt.query_row(params![name, id], |row| row.get(0))?;
                
                if count > 0 {
                    return Err(SqliteError::SqliteFailure(
                        rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                        Some("Ya existe una marca con ese nombre".to_string()),
                    ));
                }
            }
        }
        
        // Verificar si el subdepartamento existe (si se está actualizando)
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
        let mut query = String::from("UPDATE brands SET ");
        let mut params_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(name) = update.name {
            query.push_str("name = ?, ");
            params_values.push(Box::new(name));
        }
        
        if let Some(description) = update.description {
            query.push_str("description = ?, ");
            params_values.push(Box::new(description));
        }
        
        if let Some(subdepartment_id) = update.subdepartment_id {
            query.push_str("subdepartment_id = ?, ");
            params_values.push(Box::new(subdepartment_id));
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
        
        // Obtener la marca actualizada
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar la marca después de actualizar");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Eliminar una marca (borrado lógico)
    pub fn delete(pool: &DbPool, id: i64, deleted_by: Option<String>) -> SqliteResult<()> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si la marca existe
        let _brand = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Marca no encontrada para eliminar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Verificar si tiene productos asociados
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM products WHERE brand_id = ? AND (status IS NULL OR status <> 'deleted')")?;
        let count: i64 = stmt.query_row(params![id], |row| row.get(0))?;
        
        if count > 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("No se puede eliminar la marca porque tiene productos asociados".to_string()),
            ));
        }
        
        // Realizar el borrado lógico
        conn.execute(
            "UPDATE brands SET status = 'deleted', deleted_at = strftime('%Y-%m-%d %H:%M:%S', 'now'), deleted_by = ? WHERE id = ?",
            params![deleted_by, id],
        )?;
        
        Ok(())
    }
    
    // Buscar marcas por nombre (búsqueda parcial)
    pub fn search_by_name(pool: &DbPool, name: &str) -> SqliteResult<Vec<Brand>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let search_pattern = format!("%{}%", name);
        
        let mut stmt = conn.prepare(
            "SELECT id, name, description, subdepartment_id, status, deleted_at, deleted_by, created_at, updated_at 
            FROM brands 
            WHERE (status IS NULL OR status <> 'deleted') AND name LIKE ?
            ORDER BY name ASC"
        )?;
        
        let rows = stmt.query_map(params![search_pattern], |row| {
            Ok(Brand {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                subdepartment_id: row.get(3)?,
                status: row.get(4)?,
                deleted_at: row.get(5)?,
                deleted_by: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        
        let mut brands: Vec<Brand> = Vec::new();
        for row in rows {
            brands.push(row?);
        }
        
        Ok(brands)
    }
}