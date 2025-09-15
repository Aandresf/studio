// src-backend-rust/src/database_manager.rs

use rusqlite::{Connection, Result};
use std::path::Path;
use std::sync::{Arc, Mutex};

pub struct DatabaseManager {
    active_connection: Arc<Mutex<Option<Connection>>>,
}

impl DatabaseManager {
    pub fn new() -> Self {
        DatabaseManager {
            active_connection: Arc::new(Mutex::new(None)),
        }
    }

    /// Abre una conexión a una base de datos SQLite.
    /// La crea si no existe.
    pub fn connect(&self, db_path: &Path) -> Result<()> {
        let conn = Connection::open(db_path)?;
        
        // Aplicar el esquema
        crate::schema::apply_schema(&conn)?;
        
        // Guardar la conexión activa
        let mut active_conn = self.active_connection.lock().unwrap();
        *active_conn = Some(conn);
        
        Ok(())
    }
    
    /// Obtener la conexión activa
    pub fn get_active_db(&self) -> Result<Connection> {
        let active_conn = self.active_connection.lock().unwrap();
        match &*active_conn {
            Some(conn) => Ok(conn.clone()), // Aquí hay que manejar el clonado o usar Arc correctamente
            None => Err(rusqlite::Error::QueryReturnedNoRows)
        }
    }
    
    /// Cerrar todas las conexiones
    pub fn close_all_connections(&self) {
        let mut active_conn = self.active_connection.lock().unwrap();
        *active_conn = None;
    }
}