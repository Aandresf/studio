// src-backend-rust/src/models/department.rs

use crate::database_manager::DbPool;
use rusqlite::{params, Result as SqliteResult, Error as SqliteError};
use serde::{Deserialize, Serialize};
use log::{debug, error};

#[derive(Debug, Serialize, Deserialize, Clone)]
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

#[derive(Debug, Serialize, Deserialize)]
pub struct NewDepartment {
    pub name: String,
    pub abbreviation: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateDepartment {
    pub name: Option<String>,
    pub abbreviation: Option<String>,
    pub status: Option<String>,
}

impl Department {
    // Buscar un departamento por ID
    pub fn find_by_id(pool: &DbPool, id: i64) -> SqliteResult<Option<Department>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, abbreviation, status, deleted_at, deleted_by, created_at, updated_at 
            FROM departments 
            WHERE id = ? AND (status IS NULL OR status <> 'deleted')"
        )?;
        
        let rows = stmt.query_map(params![id], |row| {
            Ok(Department {
                id: row.get(0)?,
                name: row.get(1)?,
                abbreviation: row.get(2)?,
                status: row.get(3)?,
                deleted_at: row.get(4)?,
                deleted_by: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;
        
        let mut departments: Vec<Department> = Vec::new();
        for row in rows {
            departments.push(row?);
        }
        
        if departments.is_empty() {
            Ok(None)
        } else {
            Ok(Some(departments[0].clone()))
        }
    }
    
    // Obtener todos los departamentos
    pub fn find_all(pool: &DbPool) -> SqliteResult<Vec<Department>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, abbreviation, status, deleted_at, deleted_by, created_at, updated_at 
            FROM departments 
            WHERE (status IS NULL OR status <> 'deleted')
            ORDER BY name ASC"
        )?;
        
        let rows = stmt.query_map(params![], |row| {
            Ok(Department {
                id: row.get(0)?,
                name: row.get(1)?,
                abbreviation: row.get(2)?,
                status: row.get(3)?,
                deleted_at: row.get(4)?,
                deleted_by: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;
        
        let mut departments: Vec<Department> = Vec::new();
        for row in rows {
            departments.push(row?);
        }
        
        Ok(departments)
    }
    
    // Crear un nuevo departamento
    pub fn create(pool: &DbPool, department: NewDepartment) -> SqliteResult<Department> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si ya existe un departamento con el mismo nombre
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM departments WHERE name = ?")?;
        let count: i64 = stmt.query_row(params![department.name], |row| row.get(0))?;
        
        if count > 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("Ya existe un departamento con ese nombre".to_string()),
            ));
        }
        
        // Verificar si ya existe un departamento con la misma abreviatura
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM departments WHERE abbreviation = ?")?;
        let count: i64 = stmt.query_row(params![department.abbreviation], |row| row.get(0))?;
        
        if count > 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("Ya existe un departamento con esa abreviatura".to_string()),
            ));
        }
        
        // Insertar el nuevo departamento
        conn.execute(
            "INSERT INTO departments (name, abbreviation, status, created_at, updated_at) 
            VALUES (?, ?, 'Activo', strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'))",
            params![department.name, department.abbreviation],
        )?;
        
        let id = conn.last_insert_rowid();
        debug!("Departamento creado con ID: {}", id);
        
        // Obtener el departamento recién creado
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar el departamento recién creado");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Actualizar un departamento existente
    pub fn update(pool: &DbPool, id: i64, update: UpdateDepartment) -> SqliteResult<Department> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el departamento existe
        let department = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Departamento no encontrado para actualizar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Verificar unicidad del nombre si se está actualizando
        if let Some(name) = &update.name {
            if name != &department.name {
                let mut stmt = conn.prepare("SELECT COUNT(*) FROM departments WHERE name = ? AND id <> ?")?;
                let count: i64 = stmt.query_row(params![name, id], |row| row.get(0))?;
                
                if count > 0 {
                    return Err(SqliteError::SqliteFailure(
                        rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                        Some("Ya existe un departamento con ese nombre".to_string()),
                    ));
                }
            }
        }
        
        // Verificar unicidad de la abreviatura si se está actualizando
        if let Some(abbreviation) = &update.abbreviation {
            if abbreviation != &department.abbreviation {
                let mut stmt = conn.prepare("SELECT COUNT(*) FROM departments WHERE abbreviation = ? AND id <> ?")?;
                let count: i64 = stmt.query_row(params![abbreviation, id], |row| row.get(0))?;
                
                if count > 0 {
                    return Err(SqliteError::SqliteFailure(
                        rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                        Some("Ya existe un departamento con esa abreviatura".to_string()),
                    ));
                }
            }
        }
        
        // Construir la consulta de actualización
        let mut query = String::from("UPDATE departments SET ");
        let mut params_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(name) = update.name {
            query.push_str("name = ?, ");
            params_values.push(Box::new(name));
        }
        
        if let Some(abbreviation) = update.abbreviation {
            query.push_str("abbreviation = ?, ");
            params_values.push(Box::new(abbreviation));
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
        
        // Obtener el departamento actualizado
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar el departamento después de actualizar");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Eliminar un departamento (borrado lógico)
    pub fn delete(pool: &DbPool, id: i64, deleted_by: Option<String>) -> SqliteResult<()> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el departamento existe
        let _department = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Departamento no encontrado para eliminar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Verificar si tiene subdepartamentos asociados
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM subdepartments WHERE department_id = ? AND (status IS NULL OR status <> 'deleted')")?;
        let count: i64 = stmt.query_row(params![id], |row| row.get(0))?;
        
        if count > 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("No se puede eliminar el departamento porque tiene subdepartamentos asociados".to_string()),
            ));
        }
        
        // Realizar el borrado lógico
        conn.execute(
            "UPDATE departments SET status = 'deleted', deleted_at = strftime('%Y-%m-%d %H:%M:%S', 'now'), deleted_by = ? WHERE id = ?",
            params![deleted_by, id],
        )?;
        
        Ok(())
    }
    
    // Buscar departamentos por nombre (búsqueda parcial)
    pub fn search_by_name(pool: &DbPool, name: &str) -> SqliteResult<Vec<Department>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let search_pattern = format!("%{}%", name);
        
        let mut stmt = conn.prepare(
            "SELECT id, name, abbreviation, status, deleted_at, deleted_by, created_at, updated_at 
            FROM departments 
            WHERE (status IS NULL OR status <> 'deleted') AND name LIKE ?
            ORDER BY name ASC"
        )?;
        
        let rows = stmt.query_map(params![search_pattern], |row| {
            Ok(Department {
                id: row.get(0)?,
                name: row.get(1)?,
                abbreviation: row.get(2)?,
                status: row.get(3)?,
                deleted_at: row.get(4)?,
                deleted_by: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;
        
        let mut departments: Vec<Department> = Vec::new();
        for row in rows {
            departments.push(row?);
        }
        
        Ok(departments)
    }
}

// Modelo para subdepartamentos
#[derive(Debug, Serialize, Deserialize, Clone)]
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

#[derive(Debug, Serialize, Deserialize)]
pub struct NewSubdepartment {
    pub name: String,
    pub abbreviation: String,
    pub department_id: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateSubdepartment {
    pub name: Option<String>,
    pub abbreviation: Option<String>,
    pub department_id: Option<i64>,
    pub status: Option<String>,
}

impl Subdepartment {
    // Buscar un subdepartamento por ID
    pub fn find_by_id(pool: &DbPool, id: i64) -> SqliteResult<Option<Subdepartment>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, abbreviation, department_id, status, deleted_at, deleted_by, created_at, updated_at 
            FROM subdepartments 
            WHERE id = ? AND (status IS NULL OR status <> 'deleted')"
        )?;
        
        let rows = stmt.query_map(params![id], |row| {
            Ok(Subdepartment {
                id: row.get(0)?,
                name: row.get(1)?,
                abbreviation: row.get(2)?,
                department_id: row.get(3)?,
                status: row.get(4)?,
                deleted_at: row.get(5)?,
                deleted_by: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        
        let mut subdepartments: Vec<Subdepartment> = Vec::new();
        for row in rows {
            subdepartments.push(row?);
        }
        
        if subdepartments.is_empty() {
            Ok(None)
        } else {
            Ok(Some(subdepartments[0].clone()))
        }
    }
    
    // Obtener todos los subdepartamentos o filtrar por departamento_id
    pub fn find_all(pool: &DbPool, department_id: Option<i64>) -> SqliteResult<Vec<Subdepartment>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let query = match department_id {
            Some(_) => {
                "SELECT id, name, abbreviation, department_id, status, deleted_at, deleted_by, created_at, updated_at 
                FROM subdepartments 
                WHERE (status IS NULL OR status <> 'deleted') AND department_id = ?
                ORDER BY name ASC"
            },
            None => {
                "SELECT id, name, abbreviation, department_id, status, deleted_at, deleted_by, created_at, updated_at 
                FROM subdepartments 
                WHERE (status IS NULL OR status <> 'deleted')
                ORDER BY name ASC"
            }
        };
        
        let mut stmt = conn.prepare(query)?;
        
        let rows = match department_id {
            Some(dept_id) => stmt.query_map(params![dept_id], |row| {
                Ok(Subdepartment {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    abbreviation: row.get(2)?,
                    department_id: row.get(3)?,
                    status: row.get(4)?,
                    deleted_at: row.get(5)?,
                    deleted_by: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            })?,
            None => stmt.query_map(params![], |row| {
                Ok(Subdepartment {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    abbreviation: row.get(2)?,
                    department_id: row.get(3)?,
                    status: row.get(4)?,
                    deleted_at: row.get(5)?,
                    deleted_by: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            })?
        };
        
        let mut subdepartments: Vec<Subdepartment> = Vec::new();
        for row in rows {
            subdepartments.push(row?);
        }
        
        Ok(subdepartments)
    }
    
    // Crear un nuevo subdepartamento
    pub fn create(pool: &DbPool, subdepartment: NewSubdepartment) -> SqliteResult<Subdepartment> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si existe el departamento
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM departments WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
        let count: i64 = stmt.query_row(params![subdepartment.department_id], |row| row.get(0))?;
        
        if count == 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("El departamento especificado no existe".to_string()),
            ));
        }
        
        // Verificar si ya existe un subdepartamento con el mismo nombre en el mismo departamento
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM subdepartments WHERE name = ? AND department_id = ?")?;
        let count: i64 = stmt.query_row(params![subdepartment.name, subdepartment.department_id], |row| row.get(0))?;
        
        if count > 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("Ya existe un subdepartamento con ese nombre en el departamento especificado".to_string()),
            ));
        }
        
        // Verificar si ya existe un subdepartamento con la misma abreviatura en el mismo departamento
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM subdepartments WHERE abbreviation = ? AND department_id = ?")?;
        let count: i64 = stmt.query_row(params![subdepartment.abbreviation, subdepartment.department_id], |row| row.get(0))?;
        
        if count > 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("Ya existe un subdepartamento con esa abreviatura en el departamento especificado".to_string()),
            ));
        }
        
        // Insertar el nuevo subdepartamento
        conn.execute(
            "INSERT INTO subdepartments (name, abbreviation, department_id, status, created_at, updated_at) 
            VALUES (?, ?, ?, 'Activo', strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'))",
            params![subdepartment.name, subdepartment.abbreviation, subdepartment.department_id],
        )?;
        
        let id = conn.last_insert_rowid();
        debug!("Subdepartamento creado con ID: {}", id);
        
        // Obtener el subdepartamento recién creado
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar el subdepartamento recién creado");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Actualizar un subdepartamento existente
    pub fn update(pool: &DbPool, id: i64, update: UpdateSubdepartment) -> SqliteResult<Subdepartment> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el subdepartamento existe
        let subdepartment = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Subdepartamento no encontrado para actualizar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Si se está actualizando el department_id, verificar que exista
        if let Some(department_id) = update.department_id {
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM departments WHERE id = ? AND (status IS NULL OR status <> 'deleted')")?;
            let count: i64 = stmt.query_row(params![department_id], |row| row.get(0))?;
            
            if count == 0 {
                return Err(SqliteError::SqliteFailure(
                    rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                    Some("El departamento especificado no existe".to_string()),
                ));
            }
            
            // Verificar unicidad del nombre en el nuevo departamento
            if let Some(name) = &update.name {
                let mut stmt = conn.prepare("SELECT COUNT(*) FROM subdepartments WHERE name = ? AND department_id = ? AND id <> ?")?;
                let count: i64 = stmt.query_row(params![name, department_id, id], |row| row.get(0))?;
                
                if count > 0 {
                    return Err(SqliteError::SqliteFailure(
                        rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                        Some("Ya existe un subdepartamento con ese nombre en el departamento especificado".to_string()),
                    ));
                }
            } else {
                let mut stmt = conn.prepare("SELECT COUNT(*) FROM subdepartments WHERE name = ? AND department_id = ? AND id <> ?")?;
                let count: i64 = stmt.query_row(params![subdepartment.name, department_id, id], |row| row.get(0))?;
                
                if count > 0 {
                    return Err(SqliteError::SqliteFailure(
                        rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                        Some("Ya existe un subdepartamento con ese nombre en el departamento especificado".to_string()),
                    ));
                }
            }
            
            // Verificar unicidad de la abreviatura en el nuevo departamento
            if let Some(abbreviation) = &update.abbreviation {
                let mut stmt = conn.prepare("SELECT COUNT(*) FROM subdepartments WHERE abbreviation = ? AND department_id = ? AND id <> ?")?;
                let count: i64 = stmt.query_row(params![abbreviation, department_id, id], |row| row.get(0))?;
                
                if count > 0 {
                    return Err(SqliteError::SqliteFailure(
                        rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                        Some("Ya existe un subdepartamento con esa abreviatura en el departamento especificado".to_string()),
                    ));
                }
            } else {
                let mut stmt = conn.prepare("SELECT COUNT(*) FROM subdepartments WHERE abbreviation = ? AND department_id = ? AND id <> ?")?;
                let count: i64 = stmt.query_row(params![subdepartment.abbreviation, department_id, id], |row| row.get(0))?;
                
                if count > 0 {
                    return Err(SqliteError::SqliteFailure(
                        rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                        Some("Ya existe un subdepartamento con esa abreviatura en el departamento especificado".to_string()),
                    ));
                }
            }
        } else {
            // Verificar unicidad del nombre en el departamento actual
            if let Some(name) = &update.name {
                if name != &subdepartment.name {
                    let mut stmt = conn.prepare("SELECT COUNT(*) FROM subdepartments WHERE name = ? AND department_id = ? AND id <> ?")?;
                    let count: i64 = stmt.query_row(params![name, subdepartment.department_id, id], |row| row.get(0))?;
                    
                    if count > 0 {
                        return Err(SqliteError::SqliteFailure(
                            rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                            Some("Ya existe un subdepartamento con ese nombre en el departamento actual".to_string()),
                        ));
                    }
                }
            }
            
            // Verificar unicidad de la abreviatura en el departamento actual
            if let Some(abbreviation) = &update.abbreviation {
                if abbreviation != &subdepartment.abbreviation {
                    let mut stmt = conn.prepare("SELECT COUNT(*) FROM subdepartments WHERE abbreviation = ? AND department_id = ? AND id <> ?")?;
                    let count: i64 = stmt.query_row(params![abbreviation, subdepartment.department_id, id], |row| row.get(0))?;
                    
                    if count > 0 {
                        return Err(SqliteError::SqliteFailure(
                            rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                            Some("Ya existe un subdepartamento con esa abreviatura en el departamento actual".to_string()),
                        ));
                    }
                }
            }
        }
        
        // Construir la consulta de actualización
        let mut query = String::from("UPDATE subdepartments SET ");
        let mut params_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(name) = update.name {
            query.push_str("name = ?, ");
            params_values.push(Box::new(name));
        }
        
        if let Some(abbreviation) = update.abbreviation {
            query.push_str("abbreviation = ?, ");
            params_values.push(Box::new(abbreviation));
        }
        
        if let Some(department_id) = update.department_id {
            query.push_str("department_id = ?, ");
            params_values.push(Box::new(department_id));
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
        
        // Obtener el subdepartamento actualizado
        Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("No se pudo encontrar el subdepartamento después de actualizar");
                SqliteError::QueryReturnedNoRows
            })
    }
    
    // Eliminar un subdepartamento (borrado lógico)
    pub fn delete(pool: &DbPool, id: i64, deleted_by: Option<String>) -> SqliteResult<()> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        // Verificar si el subdepartamento existe
        let _subdepartment = Self::find_by_id(pool, id)?
            .ok_or_else(|| {
                error!("Subdepartamento no encontrado para eliminar");
                SqliteError::QueryReturnedNoRows
            })?;
        
        // Verificar si tiene productos asociados
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM products WHERE subdepartment_id = ? AND (status IS NULL OR status <> 'deleted')")?;
        let count: i64 = stmt.query_row(params![id], |row| row.get(0))?;
        
        if count > 0 {
            return Err(SqliteError::SqliteFailure(
                rusqlite::ffi::Error::new(19), // SQLITE_CONSTRAINT
                Some("No se puede eliminar el subdepartamento porque tiene productos asociados".to_string()),
            ));
        }
        
        // Realizar el borrado lógico
        conn.execute(
            "UPDATE subdepartments SET status = 'deleted', deleted_at = strftime('%Y-%m-%d %H:%M:%S', 'now'), deleted_by = ? WHERE id = ?",
            params![deleted_by, id],
        )?;
        
        Ok(())
    }
    
    // Buscar subdepartamentos por nombre (búsqueda parcial)
    pub fn search_by_name(pool: &DbPool, name: &str, department_id: Option<i64>) -> SqliteResult<Vec<Subdepartment>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let search_pattern = format!("%{}%", name);
        
        let query = match department_id {
            Some(_) => {
                "SELECT id, name, abbreviation, department_id, status, deleted_at, deleted_by, created_at, updated_at 
                FROM subdepartments 
                WHERE (status IS NULL OR status <> 'deleted') AND name LIKE ? AND department_id = ?
                ORDER BY name ASC"
            },
            None => {
                "SELECT id, name, abbreviation, department_id, status, deleted_at, deleted_by, created_at, updated_at 
                FROM subdepartments 
                WHERE (status IS NULL OR status <> 'deleted') AND name LIKE ?
                ORDER BY name ASC"
            }
        };
        
        let mut stmt = conn.prepare(query)?;
        
        let rows = match department_id {
            Some(dept_id) => stmt.query_map(params![search_pattern, dept_id], |row| {
                Ok(Subdepartment {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    abbreviation: row.get(2)?,
                    department_id: row.get(3)?,
                    status: row.get(4)?,
                    deleted_at: row.get(5)?,
                    deleted_by: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            })?,
            None => stmt.query_map(params![search_pattern], |row| {
                Ok(Subdepartment {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    abbreviation: row.get(2)?,
                    department_id: row.get(3)?,
                    status: row.get(4)?,
                    deleted_at: row.get(5)?,
                    deleted_by: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            })?
        };
        
        let mut subdepartments: Vec<Subdepartment> = Vec::new();
        for row in rows {
            subdepartments.push(row?);
        }
        
        Ok(subdepartments)
    }
}