// src-backend-rust/src/models/attribute.rs

use crate::database_manager::DbPool;
use rusqlite::{params, Result as SqliteResult, Error as SqliteError};
use serde::{Deserialize, Serialize};
use log::{debug, error};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Attribute {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewAttribute {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateAttribute {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
}

impl Attribute {
    // Buscar un atributo por ID
    pub fn find_by_id(pool: &DbPool, id: i64) -> SqliteResult<Option<Attribute>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, description, status, deleted_at, deleted_by, created_at, updated_at 
            FROM attributes 
            WHERE id = ? AND (status IS NULL OR status <> 'deleted')"
        )?;
        
        let rows = stmt.query_map(params![id], |row| {
            Ok(Attribute {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                deleted_at: row.get(4)?,
                deleted_by: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;
        
        let mut attributes: Vec<Attribute> = Vec::new();
        for row in rows {
            attributes.push(row?);
        }
        
        if attributes.is_empty() {
            Ok(None)
        } else {
            Ok(Some(attributes[0].clone()))
        }
    }
    
    // Obtener todos los atributos
    pub fn find_all(pool: &DbPool) -> SqliteResult<Vec<Attribute>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, description, status, deleted_at, deleted_by, created_at, updated_at 
            FROM attributes 
            WHERE (status IS NULL OR status <> 'deleted')
            ORDER BY name ASC"
        )?;
        
        let rows = stmt.query_map(params![], |row| {
            Ok(Attribute {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                deleted_at: row.get(4)?,
                deleted_by: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;
        
        let mut attributes: Vec<Attribute> = Vec::new();
        for row in rows {
            attributes.push(row?);
        }
        
        Ok(attributes)
    }
    
    // Crear un nuevo atributo
    pub fn create(pool: &DbPool, attribute: NewAttribute) -> SqliteResult<Attribute> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si ya existe un atributo con el mismo nombre
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM attributes WHERE name = ?")?;
        let count: i64 = stmt.query_row(params![attribute.name], |row| row.get(0))?;
        
        if count > 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("Ya existe un atributo con ese nombre".to_string()),
            ));
        }
        
        // Insertar el nuevo atributo
        conn.execute(
            "INSERT INTO attributes (name, description, status, created_at, updated_at) 
            VALUES (?, ?, 'Activo', strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'))",
            params![attribute.name, attribute.description],
        )?;
        
        let id = conn.last_insert_rowid();
        debug!("Atributo creado con ID: {}", id);
        
        // Obtener el atributo recién creado
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar el atributo recién creado");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Actualizar un atributo existente
    pub fn update(pool: &DbPool, id: i64, update: UpdateAttribute) -> SqliteResult<Attribute> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el atributo existe
        let attribute = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Atributo no encontrado para actualizar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Verificar unicidad del nombre si se está actualizando
        if let Some(name) = &update.name {
            if name != &attribute.name {
                let mut stmt = conn.prepare("SELECT COUNT(*) FROM attributes WHERE name = ? AND id <> ?")?;
                let count: i64 = stmt.query_row(params![name, id], |row| row.get(0))?;
                
                if count > 0 {
                    return Err(SqliteError::SqliteFailure(
                        rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                        Some("Ya existe un atributo con ese nombre".to_string()),
                    ));
                }
            }
        }
        
        // Construir la consulta de actualización
        let mut query = String::from("UPDATE attributes SET ");
        let mut params_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(name) = update.name {
            query.push_str("name = ?, ");
            params_values.push(Box::new(name));
        }
        
        if let Some(description) = update.description {
            query.push_str("description = ?, ");
            params_values.push(Box::new(description));
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
        
        // Obtener el atributo actualizado
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar el atributo después de actualizar");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Eliminar un atributo (borrado lógico)
    pub fn delete(pool: &DbPool, id: i64, deleted_by: Option<String>) -> SqliteResult<()> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el atributo existe
        let _attribute = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Atributo no encontrado para eliminar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Verificar si tiene valores de atributos asociados
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM attribute_values WHERE attribute_id = ? AND (status IS NULL OR status <> 'deleted')")?;
        let count: i64 = stmt.query_row(params![id], |row| row.get(0))?;
        
        if count > 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("No se puede eliminar el atributo porque tiene valores de atributos asociados".to_string()),
            ));
        }
        
        // Realizar el borrado lógico
        conn.execute(
            "UPDATE attributes SET status = 'deleted', deleted_at = strftime('%Y-%m-%d %H:%M:%S', 'now'), deleted_by = ? WHERE id = ?",
            params![deleted_by, id],
        )?;
        
        Ok(())
    }
    
    // Buscar atributos por nombre (búsqueda parcial)
    pub fn search_by_name(pool: &DbPool, name: &str) -> SqliteResult<Vec<Attribute>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let search_pattern = format!("%{}%", name);
        
        let mut stmt = conn.prepare(
            "SELECT id, name, description, status, deleted_at, deleted_by, created_at, updated_at 
            FROM attributes 
            WHERE (status IS NULL OR status <> 'deleted') AND name LIKE ?
            ORDER BY name ASC"
        )?;
        
        let rows = stmt.query_map(params![search_pattern], |row| {
            Ok(Attribute {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                deleted_at: row.get(4)?,
                deleted_by: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;
        
        let mut attributes: Vec<Attribute> = Vec::new();
        for row in rows {
            attributes.push(row?);
        }
        
        Ok(attributes)
    }
}

// Modelo para valores de atributos
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AttributeValue {
    pub id: i64,
    pub value: String,
    pub attribute_id: i64,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewAttributeValue {
    pub value: String,
    pub attribute_id: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateAttributeValue {
    pub value: Option<String>,
    pub attribute_id: Option<i64>,
    pub status: Option<String>,
}

impl AttributeValue {
    // Buscar un valor de atributo por ID
    pub fn find_by_id(pool: &DbPool, id: i64) -> SqliteResult<Option<AttributeValue>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, value, attribute_id, status, deleted_at, deleted_by, created_at, updated_at 
            FROM attribute_values 
            WHERE id = ? AND (status IS NULL OR status <> 'deleted')"
        )?;
        
        let rows = stmt.query_map(params![id], |row| {
            Ok(AttributeValue {
                id: row.get(0)?,
                value: row.get(1)?,
                attribute_id: row.get(2)?,
                status: row.get(3)?,
                deleted_at: row.get(4)?,
                deleted_by: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;
        
        let mut attribute_values: Vec<AttributeValue> = Vec::new();
        for row in rows {
            attribute_values.push(row?);
        }
        
        if attribute_values.is_empty() {
            Ok(None)
        } else {
            Ok(Some(attribute_values[0].clone()))
        }
    }
    
    // Obtener todos los valores de atributos
    pub fn find_all(pool: &DbPool) -> SqliteResult<Vec<AttributeValue>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, value, attribute_id, status, deleted_at, deleted_by, created_at, updated_at 
            FROM attribute_values 
            WHERE (status IS NULL OR status <> 'deleted')
            ORDER BY value ASC"
        )?;
        
        let rows = stmt.query_map(params![], |row| {
            Ok(AttributeValue {
                id: row.get(0)?,
                value: row.get(1)?,
                attribute_id: row.get(2)?,
                status: row.get(3)?,
                deleted_at: row.get(4)?,
                deleted_by: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;
        
        let mut attribute_values: Vec<AttributeValue> = Vec::new();
        for row in rows {
            attribute_values.push(row?);
        }
        
        Ok(attribute_values)
    }
    
    // Buscar valores por atributo
    pub fn find_by_attribute(pool: &DbPool, attribute_id: i64) -> SqliteResult<Vec<AttributeValue>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, value, attribute_id, status, deleted_at, deleted_by, created_at, updated_at 
            FROM attribute_values 
            WHERE (status IS NULL OR status <> 'deleted') AND attribute_id = ?
            ORDER BY value ASC"
        )?;
        
        let rows = stmt.query_map(params![attribute_id], |row| {
            Ok(AttributeValue {
                id: row.get(0)?,
                value: row.get(1)?,
                attribute_id: row.get(2)?,
                status: row.get(3)?,
                deleted_at: row.get(4)?,
                deleted_by: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;
        
        let mut attribute_values: Vec<AttributeValue> = Vec::new();
        for row in rows {
            attribute_values.push(row?);
        }
        
        Ok(attribute_values)
    }
    
    // Crear un nuevo valor de atributo
    pub fn create(pool: &DbPool, attribute_value: NewAttributeValue) -> SqliteResult<AttributeValue> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el atributo existe
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM attributes WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
        let count: i64 = stmt.query_row(params![attribute_value.attribute_id], |row| row.get(0))?;
        
        if count == 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("El atributo especificado no existe".to_string()),
            ));
        }
        
        // Verificar si ya existe un valor igual para el mismo atributo
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM attribute_values WHERE value = ? AND attribute_id = ?")?;
        let count: i64 = stmt.query_row(params![attribute_value.value, attribute_value.attribute_id], |row| row.get(0))?;
        
        if count > 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("Ya existe un valor igual para este atributo".to_string()),
            ));
        }
        
        // Insertar el nuevo valor de atributo
        conn.execute(
            "INSERT INTO attribute_values (value, attribute_id, status, created_at, updated_at) 
            VALUES (?, ?, 'Activo', strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'))",
            params![attribute_value.value, attribute_value.attribute_id],
        )?;
        
        let id = conn.last_insert_rowid();
        debug!("Valor de atributo creado con ID: {}", id);
        
        // Obtener el valor de atributo recién creado
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar el valor de atributo recién creado");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Actualizar un valor de atributo existente
    pub fn update(pool: &DbPool, id: i64, update: UpdateAttributeValue) -> SqliteResult<AttributeValue> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el valor de atributo existe
        let attribute_value = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Valor de atributo no encontrado para actualizar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Si se está actualizando el attribute_id, verificar que el atributo exista
        if let Some(attribute_id) = update.attribute_id {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM attributes WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
            let count: i64 = stmt.query_row(params![attribute_id], |row| row.get(0))?;
            
            if count == 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some("El atributo especificado no existe".to_string()),
                ));
            }
            
            // Verificar unicidad del valor en el nuevo atributo
            if let Some(value) = &update.value {
                let mut stmt = conn.prepare("SELECT COUNT(*) FROM attribute_values WHERE value = ? AND attribute_id = ? AND id <> ?")?;
                let count: i64 = stmt.query_row(params![value, attribute_id, id], |row| row.get(0))?;
                
                if count > 0 {
                    return Err(SqliteError::SqliteFailure(
                        rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                        Some("Ya existe un valor igual para este atributo".to_string()),
                    ));
                }
            } else {
                let mut stmt = conn.prepare("SELECT COUNT(*) FROM attribute_values WHERE value = ? AND attribute_id = ? AND id <> ?")?;
                let count: i64 = stmt.query_row(params![attribute_value.value, attribute_id, id], |row| row.get(0))?;
                
                if count > 0 {
                    return Err(SqliteError::SqliteFailure(
                        rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                        Some("Ya existe un valor igual para este atributo".to_string()),
                    ));
                }
            }
        } else {
            // Verificar unicidad del valor en el atributo actual
            if let Some(value) = &update.value {
                if value != &attribute_value.value {
                    let mut stmt = conn.prepare("SELECT COUNT(*) FROM attribute_values WHERE value = ? AND attribute_id = ? AND id <> ?")?;
                    let count: i64 = stmt.query_row(params![value, attribute_value.attribute_id, id], |row| row.get(0))?;
                    
                    if count > 0 {
                        return Err(SqliteError::SqliteFailure(
                            rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                            Some("Ya existe un valor igual para este atributo".to_string()),
                        ));
                    }
                }
            }
        }
        
        // Construir la consulta de actualización
        let mut query = String::from("UPDATE attribute_values SET ");
        let mut params_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(value) = update.value {
            query.push_str("value = ?, ");
            params_values.push(Box::new(value));
        }
        
        if let Some(attribute_id) = update.attribute_id {
            query.push_str("attribute_id = ?, ");
            params_values.push(Box::new(attribute_id));
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
        
        // Obtener el valor de atributo actualizado
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar el valor de atributo después de actualizar");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Eliminar un valor de atributo (borrado lógico)
    pub fn delete(pool: &DbPool, id: i64, deleted_by: Option<String>) -> SqliteResult<()> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el valor de atributo existe
        let _attribute_value = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Valor de atributo no encontrado para eliminar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Verificar si tiene variantes de productos asociadas
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM product_variant_attributes WHERE attribute_value_id = ?")?;
        let count: i64 = stmt.query_row(params![id], |row| row.get(0))?;
        
        if count > 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("No se puede eliminar el valor de atributo porque está asociado a variantes de productos".to_string()),
            ));
        }
        
        // Realizar el borrado lógico
        conn.execute(
            "UPDATE attribute_values SET status = 'deleted', deleted_at = strftime('%Y-%m-%d %H:%M:%S', 'now'), deleted_by = ? WHERE id = ?",
            params![deleted_by, id],
        )?;
        
        Ok(())
    }
    
    // Buscar valores de atributos por valor (búsqueda parcial)
    pub fn search_by_value(pool: &DbPool, value: &str, attribute_id: Option<i64>) -> SqliteResult<Vec<AttributeValue>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let search_pattern = format!("%{}%", value);
        
        let query = match attribute_id {
            Some(_) => {
                "SELECT id, value, attribute_id, status, deleted_at, deleted_by, created_at, updated_at 
                FROM attribute_values 
                WHERE (status IS NULL OR status <> 'deleted') AND value LIKE ? AND attribute_id = ?
                ORDER BY value ASC"
            },
            None => {
                "SELECT id, value, attribute_id, status, deleted_at, deleted_by, created_at, updated_at 
                FROM attribute_values 
                WHERE (status IS NULL OR status <> 'deleted') AND value LIKE ?
                ORDER BY value ASC"
            }
        };
        
        let mut stmt = conn.prepare(query)?;
        
        let rows = match attribute_id {
            Some(attr_id) => stmt.query_map(params![search_pattern, attr_id], |row| {
                Ok(AttributeValue {
                    id: row.get(0)?,
                    value: row.get(1)?,
                    attribute_id: row.get(2)?,
                    status: row.get(3)?,
                    deleted_at: row.get(4)?,
                    deleted_by: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })?,
            None => stmt.query_map(params![search_pattern], |row| {
                Ok(AttributeValue {
                    id: row.get(0)?,
                    value: row.get(1)?,
                    attribute_id: row.get(2)?,
                    status: row.get(3)?,
                    deleted_at: row.get(4)?,
                    deleted_by: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })?
        };
        
        let mut attribute_values: Vec<AttributeValue> = Vec::new();
        for row in rows {
            attribute_values.push(row?);
        }
        
        Ok(attribute_values)
    }
}