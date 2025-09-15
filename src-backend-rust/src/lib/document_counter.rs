// src-backend-rust/src/lib/document_counter.rs

use rusqlite::{Connection, Result, params};

pub struct DocumentCounter;

impl DocumentCounter {
    /// Obtiene el siguiente número para un tipo de documento específico
    pub fn get_next_number(conn: &Connection, counter_type: &str) -> Result<i64> {
        conn.execute(
            "INSERT OR IGNORE INTO document_counters (counter_type, last_number) VALUES (?, 0)",
            params![counter_type]
        )?;
        
        conn.execute(
            "UPDATE document_counters SET last_number = last_number + 1 WHERE counter_type = ?",
            params![counter_type]
        )?;
        
        let last_number: i64 = conn.query_row(
            "SELECT last_number FROM document_counters WHERE counter_type = ?",
            params![counter_type],
            |row| row.get(0)
        )?;
        
        Ok(last_number)
    }
    
    /// Reinicia un contador a un valor específico
    pub fn reset_counter(conn: &Connection, counter_type: &str, value: i64) -> Result<()> {
        conn.execute(
            "UPDATE document_counters SET last_number = ? WHERE counter_type = ?",
            params![value, counter_type]
        )?;
        
        Ok(())
    }
}