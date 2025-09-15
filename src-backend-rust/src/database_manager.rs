// src-backend-rust/src/database_manager.rs

use rusqlite::{Connection, Result, Error as SQLiteError};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use r2d2::{Pool, PooledConnection};
use r2d2_sqlite::SqliteConnectionManager;
use std::fs;
use log::{info, error, debug};

type DbPool = Pool<SqliteConnectionManager>;
type DbConnection = PooledConnection<SqliteConnectionManager>;

#[derive(Clone)]
pub struct DatabaseManager {
    pool: Arc<Mutex<Option<DbPool>>>,
    db_path: Arc<Mutex<Option<PathBuf>>>,
}

impl DatabaseManager {
    pub fn new() -> Self {
        DatabaseManager {
            pool: Arc::new(Mutex::new(None)),
            db_path: Arc::new(Mutex::new(None)),
        }
    }

    /// Inicializa el pool de conexiones a la base de datos SQLite.
    /// La crea si no existe.
    pub fn initialize(&self, db_path: &Path) -> Result<(), String> {
        // Asegurarse de que el directorio existe
        if let Some(parent) = db_path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Error creando el directorio para la base de datos: {}", e))?;
            }
        }
        
        // Crear el manager para SQLite
        let manager = SqliteConnectionManager::file(db_path);
        
        // Crear el pool con un número razonable de conexiones
        let pool = Pool::builder()
            .max_size(10) // Máximo 10 conexiones simultáneas
            .build(manager)
            .map_err(|e| format!("Error al crear el pool de conexiones: {}", e))?;
        
        // Inicializar el esquema
        let conn = pool.get()
            .map_err(|e| format!("Error al obtener conexión del pool: {}", e))?;
        
        crate::schema::apply_schema(&conn)
            .map_err(|e| format!("Error al aplicar el esquema: {}", e))?;
        
        // Guardar el pool
        {
            let mut pool_guard = self.pool.lock().unwrap();
            *pool_guard = Some(pool);
        }
        
        // Guardar la ruta de la base de datos
        {
            let mut path_guard = self.db_path.lock().unwrap();
            *path_guard = Some(db_path.to_path_buf());
        }
        
        info!("Base de datos inicializada correctamente en: {:?}", db_path);
        Ok(())
    }
    
    /// Obtener una conexión del pool
    pub fn get_connection(&self) -> Result<DbConnection, String> {
        let pool_guard = self.pool.lock().unwrap();
        match &*pool_guard {
            Some(pool) => pool.get()
                .map_err(|e| format!("Error al obtener conexión del pool: {}", e)),
            None => Err("El pool de conexiones no ha sido inicializado".into())
        }
    }
    
    /// Ejecutar una transacción con una función
    pub fn transaction<F, T>(&self, f: F) -> Result<T, String>
    where
        F: FnOnce(&Connection) -> Result<T, SQLiteError>
    {
        let conn = self.get_connection()?;
        conn.execute("BEGIN TRANSACTION", [])
            .map_err(|e| format!("Error al iniciar transacción: {}", e))?;
        
        let result = match f(&conn) {
            Ok(value) => {
                conn.execute("COMMIT", [])
                    .map_err(|e| format!("Error al confirmar transacción: {}", e))?;
                Ok(value)
            },
            Err(e) => {
                conn.execute("ROLLBACK", [])
                    .map_err(|_| format!("Error al revertir transacción tras error: {}", e))?;
                Err(format!("Error en la transacción: {}", e))
            }
        };
        
        result
    }
    
    /// Obtener la ruta de la base de datos
    pub fn get_db_path(&self) -> Option<PathBuf> {
        let path_guard = self.db_path.lock().unwrap();
        path_guard.clone()
    }
    
    /// Cerrar todas las conexiones
    pub fn close(&self) {
        {
            let mut pool_guard = self.pool.lock().unwrap();
            *pool_guard = None;
        }
        {
            let mut path_guard = self.db_path.lock().unwrap();
            *path_guard = None;
        }
        debug!("Todas las conexiones a la base de datos han sido cerradas");
    }
    
    /// Comprobar si la conexión está activa
    pub fn is_connected(&self) -> bool {
        let pool_guard = self.pool.lock().unwrap();
        pool_guard.is_some()
    }
}

/// Ejecuta una consulta y devuelve las filas afectadas
pub fn execute_update(conn: &Connection, sql: &str, params: &[&dyn rusqlite::ToSql]) -> Result<usize, SQLiteError> {
    conn.execute(sql, params)
}

/// Ejecuta una consulta y devuelve el ID de la última fila insertada
pub fn execute_insert(conn: &Connection, sql: &str, params: &[&dyn rusqlite::ToSql]) -> Result<i64, SQLiteError> {
    conn.execute(sql, params)?;
    Ok(conn.last_insert_rowid())
}

/// Ejecuta una consulta que devuelve una sola fila
pub fn query_row<T, F>(conn: &Connection, sql: &str, params: &[&dyn rusqlite::ToSql], f: F) -> Result<T, SQLiteError>
where
    F: FnOnce(&rusqlite::Row<'_>) -> Result<T, SQLiteError>
{
    conn.query_row(sql, params, f)
}

/// Ejecuta una consulta que devuelve múltiples filas
pub fn query_rows<T, F>(conn: &Connection, sql: &str, params: &[&dyn rusqlite::ToSql], f: F) -> Result<Vec<T>, SQLiteError>
where
    F: FnMut(&rusqlite::Row<'_>) -> Result<T, SQLiteError>
{
    let mut stmt = conn.prepare(sql)?;
    let rows = stmt.query_map(params, f)?;
    
    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    
    Ok(result)
}