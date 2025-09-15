// src-backend-rust/src/models/setting.rs

use crate::database_manager::DbPool;
use rusqlite::{params, Result as SqliteResult, Error as SqliteError};
use serde::{Deserialize, Serialize};
use serde_json::{Value as JsonValue, from_str, to_string};
use log::{debug, error};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Setting {
    pub id: i64,
    pub category: String,
    pub key: String,
    pub value: JsonValue,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewSetting {
    pub category: String,
    pub key: String,
    pub value: JsonValue,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateSetting {
    pub value: JsonValue,
    pub description: Option<String>,
}

impl Setting {
    // Obtener todas las configuraciones
    pub fn find_all(pool: &DbPool) -> SqliteResult<Vec<Setting>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, category, key, value, description, created_at, updated_at 
             FROM settings
             ORDER BY category, key"
        )?;
        
        let rows = stmt.query_map(params![], |row| {
            let value_str: String = row.get(3)?;
            let json_value: JsonValue = match from_str(&value_str) {
                Ok(v) => v,
                Err(_) => JsonValue::String(value_str), // Si no es JSON válido, lo tratamos como string
            };
            
            Ok(Setting {
                id: row.get(0)?,
                category: row.get(1)?,
                key: row.get(2)?,
                value: json_value,
                description: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;
        
        let mut settings: Vec<Setting> = Vec::new();
        for row in rows {
            settings.push(row?);
        }
        
        Ok(settings)
    }
    
    // Agrupar configuraciones por categoría
    pub fn get_by_categories(pool: &DbPool) -> SqliteResult<HashMap<String, HashMap<String, JsonValue>>> {
        let settings = Self::find_all(pool)?;
        let mut grouped: HashMap<String, HashMap<String, JsonValue>> = HashMap::new();
        
        for setting in settings {
            let category_map = grouped.entry(setting.category).or_insert_with(HashMap::new);
            category_map.insert(setting.key, setting.value);
        }
        
        Ok(grouped)
    }
    
    // Obtener configuración por clave
    pub fn find_by_key(pool: &DbPool, key: &str) -> SqliteResult<Option<Setting>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, category, key, value, description, created_at, updated_at 
             FROM settings
             WHERE key = ?"
        )?;
        
        let rows = stmt.query_map(params![key], |row| {
            let value_str: String = row.get(3)?;
            let json_value: JsonValue = match from_str(&value_str) {
                Ok(v) => v,
                Err(_) => JsonValue::String(value_str), // Si no es JSON válido, lo tratamos como string
            };
            
            Ok(Setting {
                id: row.get(0)?,
                category: row.get(1)?,
                key: row.get(2)?,
                value: json_value,
                description: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;
        
        let mut settings: Vec<Setting> = Vec::new();
        for row in rows {
            settings.push(row?);
        }
        
        if settings.is_empty() {
            Ok(None)
        } else {
            Ok(Some(settings[0].clone()))
        }
    }
    
    // Obtener configuraciones por categoría
    pub fn find_by_category(pool: &DbPool, category: &str) -> SqliteResult<Vec<Setting>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, category, key, value, description, created_at, updated_at 
             FROM settings
             WHERE category = ?
             ORDER BY key"
        )?;
        
        let rows = stmt.query_map(params![category], |row| {
            let value_str: String = row.get(3)?;
            let json_value: JsonValue = match from_str(&value_str) {
                Ok(v) => v,
                Err(_) => JsonValue::String(value_str), // Si no es JSON válido, lo tratamos como string
            };
            
            Ok(Setting {
                id: row.get(0)?,
                category: row.get(1)?,
                key: row.get(2)?,
                value: json_value,
                description: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;
        
        let mut settings: Vec<Setting> = Vec::new();
        for row in rows {
            settings.push(row?);
        }
        
        Ok(settings)
    }
    
    // Crear una nueva configuración
    pub fn create(pool: &DbPool, new_setting: NewSetting) -> SqliteResult<Setting> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si ya existe una configuración con la misma clave
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM settings WHERE key = ?")?;
        let count: i64 = stmt.query_row(params![new_setting.key], |row| row.get(0))?;
        
        if count > 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some(format!("Ya existe una configuración con la clave '{}'", new_setting.key)),
            ));
        }
        
        // Convertir el valor JSON a string
        let value_str = match to_string(&new_setting.value) {
            Ok(s) => s,
            Err(e) => {
                error!("Error al serializar el valor JSON: {}", e);
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(1), // SQLITE_ERROR
                    Some("Error al serializar el valor JSON".to_string()),
                ));
            }
        };
        
        // Insertar la nueva configuración
        conn.execute(
            "INSERT INTO settings (category, key, value, description, created_at, updated_at) 
             VALUES (?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'))",
            params![new_setting.category, new_setting.key, value_str, new_setting.description],
        )?;
        
        let id = conn.last_insert_rowid();
        
        debug!("Configuración creada con ID: {}", id);
        
        // Obtener la configuración recién creada
        match Self::find_by_key(pool, &new_setting.key)? {
            Some(setting) => Ok(setting),
            None => Err(SqliteError::QueryReturnedNoRows),
        }
    }
    
    // Actualizar una configuración existente
    pub fn update(pool: &DbPool, key: &str, update: UpdateSetting) -> SqliteResult<Setting> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si existe la configuración
        let existing = match Self::find_by_key(pool, key)? {
            Some(s) => s,
            None => {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(1), // SQLITE_ERROR
                    Some(format!("No existe una configuración con la clave '{}'", key)),
                ));
            }
        };
        
        // Convertir el valor JSON a string
        let value_str = match to_string(&update.value) {
            Ok(s) => s,
            Err(e) => {
                error!("Error al serializar el valor JSON: {}", e);
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(1), // SQLITE_ERROR
                    Some("Error al serializar el valor JSON".to_string()),
                ));
            }
        };
        
        // Actualizar la configuración
        let description_param = match update.description {
            Some(ref desc) => desc as &dyn rusqlite::ToSql,
            None => &existing.description as &dyn rusqlite::ToSql,
        };
        
        conn.execute(
            "UPDATE settings 
             SET value = ?, description = ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now')
             WHERE key = ?",
            params![value_str, description_param, key],
        )?;
        
        debug!("Configuración actualizada: {}", key);
        
        // Obtener la configuración actualizada
        match Self::find_by_key(pool, key)? {
            Some(setting) => Ok(setting),
            None => Err(SqliteError::QueryReturnedNoRows),
        }
    }
    
    // Eliminar una configuración
    pub fn delete(pool: &DbPool, key: &str) -> SqliteResult<bool> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si existe la configuración
        let exists = match Self::find_by_key(pool, key)? {
            Some(_) => true,
            None => false,
        };
        
        if !exists {
            return Ok(false);
        }
        
        // Eliminar la configuración
        conn.execute(
            "DELETE FROM settings WHERE key = ?",
            params![key],
        )?;
        
        debug!("Configuración eliminada: {}", key);
        
        Ok(true)
    }
    
    // Obtener una configuración específica como un tipo específico
    pub fn get_as_string(pool: &DbPool, key: &str) -> SqliteResult<Option<String>> {
        match Self::find_by_key(pool, key)? {
            Some(setting) => {
                match setting.value {
                    JsonValue::String(s) => Ok(Some(s)),
                    _ => Ok(Some(setting.value.to_string())),
                }
            },
            None => Ok(None),
        }
    }
    
    pub fn get_as_bool(pool: &DbPool, key: &str) -> SqliteResult<Option<bool>> {
        match Self::find_by_key(pool, key)? {
            Some(setting) => {
                match setting.value {
                    JsonValue::Bool(b) => Ok(Some(b)),
                    JsonValue::String(s) => {
                        match s.to_lowercase().as_str() {
                            "true" | "1" | "yes" | "y" => Ok(Some(true)),
                            "false" | "0" | "no" | "n" => Ok(Some(false)),
                            _ => Ok(None),
                        }
                    },
                    JsonValue::Number(n) => {
                        if let Some(i) = n.as_i64() {
                            Ok(Some(i != 0))
                        } else {
                            Ok(None)
                        }
                    },
                    _ => Ok(None),
                }
            },
            None => Ok(None),
        }
    }
    
    pub fn get_as_i64(pool: &DbPool, key: &str) -> SqliteResult<Option<i64>> {
        match Self::find_by_key(pool, key)? {
            Some(setting) => {
                match setting.value {
                    JsonValue::Number(n) => {
                        if let Some(i) = n.as_i64() {
                            Ok(Some(i))
                        } else {
                            Ok(None)
                        }
                    },
                    JsonValue::String(s) => {
                        match s.parse::<i64>() {
                            Ok(i) => Ok(Some(i)),
                            Err(_) => Ok(None),
                        }
                    },
                    _ => Ok(None),
                }
            },
            None => Ok(None),
        }
    }
    
    pub fn get_as_f64(pool: &DbPool, key: &str) -> SqliteResult<Option<f64>> {
        match Self::find_by_key(pool, key)? {
            Some(setting) => {
                match setting.value {
                    JsonValue::Number(n) => {
                        if let Some(f) = n.as_f64() {
                            Ok(Some(f))
                        } else {
                            Ok(None)
                        }
                    },
                    JsonValue::String(s) => {
                        match s.parse::<f64>() {
                            Ok(f) => Ok(Some(f)),
                            Err(_) => Ok(None),
                        }
                    },
                    _ => Ok(None),
                }
            },
            None => Ok(None),
        }
    }
    
    pub fn get_as_json(pool: &DbPool, key: &str) -> SqliteResult<Option<JsonValue>> {
        match Self::find_by_key(pool, key)? {
            Some(setting) => Ok(Some(setting.value)),
            None => Ok(None),
        }
    }
}