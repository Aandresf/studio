// src-backend-rust/src/models/user.rs

use serde::{Deserialize, Serialize};
use rusqlite::{Connection, Result as SQLiteResult, Error as SQLiteError, Row};
use bcrypt::{hash, verify, DEFAULT_COST};
use crate::database_manager::{self, query_row, query_rows, execute_update, execute_insert};
use nanoid::nanoid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: String,
    pub name: Option<String>,
    pub username: String,
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub role_id: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing)]
    pub password_hash: Option<String>,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewUser {
    pub username: String,
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub password: String,
    pub role_id: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserUpdate {
    pub name: Option<String>,
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub password: Option<String>,
    pub role_id: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: String,
    pub username: String,
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub role_id: Option<String>,
    pub status: String,
}

impl User {
    // Crear un nuevo usuario
    pub fn create(conn: &Connection, new_user: &NewUser) -> SQLiteResult<String> {
        // Generar ID único
        let id = nanoid!(10);
        
        // Hashear la contraseña
        let hashed_password = match hash(&new_user.password, DEFAULT_COST) {
            Ok(h) => h,
            Err(_) => return Err(SQLiteError::InvalidQuery),
        };

        // Fecha actual en formato YYYY-MM-DD HH:MM:SS
        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
        
        // Estado por defecto si no se proporciona
        let status = new_user.status.clone().unwrap_or_else(|| "Activo".to_string());

        // Insertar usuario
        conn.execute(
            "INSERT INTO users (id, username, display_name, email, password_hash, role_id, status, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            &[
                &id as &dyn rusqlite::ToSql,
                &new_user.username as &dyn rusqlite::ToSql,
                &new_user.display_name as &dyn rusqlite::ToSql,
                &new_user.email as &dyn rusqlite::ToSql,
                &hashed_password as &dyn rusqlite::ToSql,
                &new_user.role_id as &dyn rusqlite::ToSql,
                &status as &dyn rusqlite::ToSql,
                &now as &dyn rusqlite::ToSql,
                &now as &dyn rusqlite::ToSql,
            ],
        )?;
        
        Ok(id)
    }

    // Actualizar un usuario existente
    pub fn update(conn: &Connection, id: &str, update: &UserUpdate) -> SQLiteResult<usize> {
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        let mut set_clauses = Vec::new();

        // Construir cláusulas SET según los campos proporcionados
        if let Some(ref name) = update.name {
            set_clauses.push("name = ?");
            params.push(Box::new(name.clone()));
        }
        
        if let Some(ref display_name) = update.display_name {
            set_clauses.push("display_name = ?");
            params.push(Box::new(display_name.clone()));
        }

        if let Some(ref email) = update.email {
            set_clauses.push("email = ?");
            params.push(Box::new(email.clone()));
        }

        if let Some(ref password) = update.password {
            // Hashear la nueva contraseña
            let hashed_password = match hash(password, DEFAULT_COST) {
                Ok(h) => h,
                Err(_) => return Err(SQLiteError::InvalidQuery),
            };
            set_clauses.push("password_hash = ?");
            params.push(Box::new(hashed_password));
        }

        if let Some(ref role_id) = update.role_id {
            set_clauses.push("role_id = ?");
            params.push(Box::new(role_id.clone()));
        }

        if let Some(ref status) = update.status {
            set_clauses.push("status = ?");
            params.push(Box::new(status.clone()));
        }

        // Actualizar la fecha de modificación
        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
        set_clauses.push("updated_at = ?");
        params.push(Box::new(now));

        // Si no hay campos para actualizar, retornar 0 filas afectadas
        if set_clauses.is_empty() {
            return Ok(0);
        }

        // Construir la consulta SQL
        let sql = format!(
            "UPDATE users SET {} WHERE id = ?",
            set_clauses.join(", ")
        );
        
        // Añadir el ID al final de los parámetros
        params.push(Box::new(id.to_string()));

        // Convertir Vec<Box<dyn ToSql>> a Vec<&dyn ToSql>
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter()
            .map(|p| p.as_ref() as &dyn rusqlite::ToSql)
            .collect();

        // Ejecutar la actualización
        execute_update(conn, &sql, &param_refs)
    }

    // Marcar un usuario como eliminado (soft delete)
    pub fn soft_delete(conn: &Connection, id: &str, deleted_by: &str) -> SQLiteResult<usize> {
        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
        
        execute_update(
            conn,
            "UPDATE users SET status = 'Eliminado', deleted_at = ?, deleted_by = ?, updated_at = ? WHERE id = ?",
            &[&now as &dyn rusqlite::ToSql, &deleted_by as &dyn rusqlite::ToSql, &now as &dyn rusqlite::ToSql, &id as &dyn rusqlite::ToSql],
        )
    }
    
    // Buscar un usuario por ID
    pub fn find_by_id(conn: &Connection, id: &str) -> SQLiteResult<User> {
        query_row(
            conn,
            "SELECT id, name, username, display_name, email, password_hash, role_id, status, created_at, updated_at, deleted_at, deleted_by FROM users WHERE id = ?",
            &[&id],
            |row| Self::from_row(row),
        )
    }

    // Buscar un usuario por nombre de usuario
    pub fn find_by_username(conn: &Connection, username: &str) -> SQLiteResult<User> {
        query_row(
            conn,
            "SELECT id, name, username, display_name, email, password_hash, role_id, status, created_at, updated_at, deleted_at, deleted_by FROM users WHERE username = ?",
            &[&username],
            |row| Self::from_row(row),
        )
    }

    // Obtener todos los usuarios activos
    pub fn find_all(conn: &Connection) -> SQLiteResult<Vec<User>> {
        query_rows(
            conn,
            "SELECT id, name, username, display_name, email, password_hash, role_id, status, created_at, updated_at, deleted_at, deleted_by FROM users WHERE status != 'Eliminado' ORDER BY username",
            &[],
            |row| Self::from_row(row),
        )
    }

    // Eliminar un usuario (hard delete)
    pub fn delete(conn: &Connection, id: &str) -> SQLiteResult<usize> {
        execute_update(
            conn,
            "DELETE FROM users WHERE id = ?",
            &[&id],
        )
    }

    // Verificar credenciales de un usuario
    pub fn authenticate(conn: &Connection, auth: &AuthRequest) -> SQLiteResult<Option<User>> {
        // Buscar usuario por nombre de usuario
        let user_result = Self::find_by_username(conn, &auth.username);
        
        match user_result {
            Ok(user) => {
                // Verificar que el usuario esté activo
                if user.status != "Activo" {
                    return Ok(None);
                }
                
                // Verificar que tenga password_hash
                if let Some(ref password_hash) = user.password_hash {
                    // Verificar contraseña
                    match verify(&auth.password, password_hash) {
                        Ok(true) => Ok(Some(user)),
                        _ => Ok(None), // Contraseña incorrecta
                    }
                } else {
                    Ok(None) // No tiene contraseña configurada
                }
            },
            Err(SQLiteError::QueryReturnedNoRows) => Ok(None), // Usuario no encontrado
            Err(e) => Err(e), // Otro error
        }
    }

    // Convertir una fila de la base de datos en un objeto User
    fn from_row(row: &Row) -> SQLiteResult<User> {
        Ok(User {
            id: row.get(0)?,
            name: row.get(1)?,
            username: row.get(2)?,
            display_name: row.get(3)?,
            email: row.get(4)?,
            password_hash: row.get(5)?,
            role_id: row.get(6)?,
            status: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
            deleted_at: row.get(10)?,
            deleted_by: row.get(11)?,
        })
    }

    // Convertir un User a UserResponse
    pub fn to_response(&self) -> UserResponse {
        UserResponse {
            id: self.id.clone(),
            username: self.username.clone(),
            display_name: self.display_name.clone(),
            email: self.email.clone(),
            role_id: self.role_id.clone(),
            status: self.status.clone(),
        }
    }
}