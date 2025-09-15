//src-backend-rust/src/models/role_permission.rs

use serde::{Deserialize, Serialize};
use rusqlite::{Connection, Result as SQLiteResult, Row};
use std::collections::HashMap;
use crate::database_manager::{query_row, query_rows, execute_update, execute_insert};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Role {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Permission {
    pub id: i64,
    pub key: String,
    pub label: Option<String>,
    pub description: Option<String>,
    pub status: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PermissionMeta {
    pub key: String,
    pub label: String,
    pub description: String,
    pub category: String,
    pub affected: Vec<String>,
    pub requires: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RolePermissions {
    pub role_id: String,
    pub permissions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserPermissions {
    pub user_id: String,
    pub permissions: Vec<String>,
}

// Implementación para Role
impl Role {
    // Crear un nuevo rol
    pub fn create(conn: &Connection, id: &str, name: &str, description: Option<&str>) -> SQLiteResult<()> {
        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
        
        conn.execute(
            "INSERT INTO roles (id, name, description, status, created_at, updated_at) 
             VALUES (?, ?, ?, 'Activo', ?, ?)",
            &[
                &id as &dyn rusqlite::ToSql,
                &name as &dyn rusqlite::ToSql,
                &description as &dyn rusqlite::ToSql,
                &now as &dyn rusqlite::ToSql,
                &now as &dyn rusqlite::ToSql,
            ],
        )?;
        
        Ok(())
    }

    // Actualizar un rol existente
    pub fn update(conn: &Connection, id: &str, name: &str, description: Option<&str>) -> SQLiteResult<usize> {
        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
        
        execute_update(
            conn,
            "UPDATE roles SET name = ?, description = ?, updated_at = ? WHERE id = ?",
            &[&name as &dyn rusqlite::ToSql, &description as &dyn rusqlite::ToSql, &now as &dyn rusqlite::ToSql, &id as &dyn rusqlite::ToSql],
        )
    }

    // Eliminar un rol (soft delete)
    pub fn soft_delete(conn: &Connection, id: &str, deleted_by: &str) -> SQLiteResult<usize> {
        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
        
        execute_update(
            conn,
            "UPDATE roles SET status = 'Eliminado', deleted_at = ?, deleted_by = ?, updated_at = ? WHERE id = ?",
            &[&now as &dyn rusqlite::ToSql, &deleted_by as &dyn rusqlite::ToSql, &now as &dyn rusqlite::ToSql, &id as &dyn rusqlite::ToSql],
        )
    }

    // Buscar un rol por ID
    pub fn find_by_id(conn: &Connection, id: &str) -> SQLiteResult<Role> {
        query_row(
            conn,
            "SELECT id, name, description, status, deleted_at, deleted_by, created_at, updated_at FROM roles WHERE id = ?",
            &[&id],
            |row| Self::from_row(row),
        )
    }

    // Obtener todos los roles activos
    pub fn find_all(conn: &Connection) -> SQLiteResult<Vec<Role>> {
        query_rows(
            conn,
            "SELECT id, name, description, status, deleted_at, deleted_by, created_at, updated_at FROM roles WHERE status != 'Eliminado' ORDER BY name",
            &[],
            |row| Self::from_row(row),
        )
    }

    // Convertir una fila de la base de datos en un objeto Role
    fn from_row(row: &Row) -> SQLiteResult<Role> {
        Ok(Role {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            status: row.get(3)?,
            deleted_at: row.get(4)?,
            deleted_by: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    }
}

// Implementación para Permission
impl Permission {
    // Registrar un nuevo permiso
    pub fn create(conn: &Connection, key: &str, label: Option<&str>, description: Option<&str>) -> SQLiteResult<i64> {
        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
        
        execute_insert(
            conn,
            "INSERT INTO permissions (key, label, description, status, created_at) 
             VALUES (?, ?, ?, 'Activo', ?)",
            &[
                &key as &dyn rusqlite::ToSql,
                &label as &dyn rusqlite::ToSql,
                &description as &dyn rusqlite::ToSql,
                &now as &dyn rusqlite::ToSql,
            ],
        )
    }

    // Buscar un permiso por clave
    pub fn find_by_key(conn: &Connection, key: &str) -> SQLiteResult<Permission> {
        query_row(
            conn,
            "SELECT id, key, label, description, status, deleted_at, deleted_by, created_at FROM permissions WHERE key = ?",
            &[&key],
            |row| Self::from_row(row),
        )
    }

    // Obtener todos los permisos
    pub fn find_all(conn: &Connection) -> SQLiteResult<Vec<Permission>> {
        query_rows(
            conn,
            "SELECT id, key, label, description, status, deleted_at, deleted_by, created_at FROM permissions WHERE status != 'Eliminado' ORDER BY key",
            &[],
            |row| Self::from_row(row),
        )
    }

    // Convertir una fila de la base de datos en un objeto Permission
    fn from_row(row: &Row) -> SQLiteResult<Permission> {
        Ok(Permission {
            id: row.get(0)?,
            key: row.get(1)?,
            label: row.get(2)?,
            description: row.get(3)?,
            status: row.get(4)?,
            deleted_at: row.get(5)?,
            deleted_by: row.get(6)?,
            created_at: row.get(7)?,
        })
    }

    // Asegurar que todos los permisos del catálogo estén registrados en la base de datos
    pub fn ensure_permissions_catalog(conn: &Connection) -> SQLiteResult<()> {
        // Lista completa de permisos según lo visto en permissionsMeta.ts
        let permissions = [
            "*", 
            "sales:create", "sales:read", "sales:edit", "sales:annul", "sales:delete", "sales:edit_price", "sales:edit_invoice",
            "purchases:read", "purchases:create", "purchases:edit", "purchases:annul", "purchases:delete",
            "products:read", "products:create", "products:edit", "products:delete", "products:read_prices_sale", 
            "products:read_costs", "products:read_costs_disabled", "products:manual_sku",
            "admin:backup", "admin:restore",
            "reports:read", "reports:create_snapshot", "dashboard:read",
            "settings:edit", "settings:advanced", "catalog:manage",
            "stores:create", "stores:delete", "stores:set_active",
            "departments:create", "departments:edit", "departments:delete",
            "brands:create", "brands:edit", "brands:delete",
            "attributes:create", "attributes:edit", "attributes:delete", 
            "attributes:create_value", "attributes:edit_value", "attributes:delete_value",
            "variants:read", "variants:create",
            "inventory:write", "pending:create", "pending:delete",
            "users:create", "users:edit", "users:delete", "users:permissions",
            "customers:read", "customers:create", "customers:edit", "customers:delete", "customers:view_sensitive",
            "suppliers:read", "suppliers:create", "suppliers:edit", "suppliers:delete", "suppliers:view_sensitive"
        ];

        // Registrar cada permiso si no existe
        for perm_key in permissions.iter() {
            let result = Self::find_by_key(conn, perm_key);
            if result.is_err() {
                Self::create(conn, perm_key, None, None)?;
            }
        }

        Ok(())
    }
}

// Funciones para gestionar la relación entre roles y permisos
pub fn assign_permission_to_role(conn: &Connection, role_id: &str, permission_key: &str) -> SQLiteResult<()> {
    // Obtener el ID del permiso
    let permission = Permission::find_by_key(conn, permission_key)?;
    
    // Verificar si ya existe la asignación
    let exists: bool = conn.query_row(
        "SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?",
        &[&role_id, &permission.id],
        |_| Ok(true)
    ).unwrap_or(false);
    
    if !exists {
        // Insertar la relación
        conn.execute(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
            &[&role_id, &permission.id],
        )?;
    }
    
    Ok(())
}

pub fn remove_permission_from_role(conn: &Connection, role_id: &str, permission_key: &str) -> SQLiteResult<()> {
    // Obtener el ID del permiso
    let permission = Permission::find_by_key(conn, permission_key)?;
    
    // Eliminar la relación
    conn.execute(
        "DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?",
        &[&role_id, &permission.id],
    )?;
    
    Ok(())
}

// Funciones para gestionar permisos de usuario
pub fn get_user_permissions(conn: &Connection, user_id: &str) -> SQLiteResult<Vec<String>> {
    // Primero verificar si el usuario tiene un rol asignado
    let role_id: Option<String> = conn.query_row(
        "SELECT role_id FROM users WHERE id = ?",
        &[&user_id],
        |row| row.get(0)
    ).unwrap_or(None);
    
    let mut permissions = Vec::new();
    
    // Si tiene rol, obtener permisos del rol
    if let Some(role) = role_id {
        let role_perms: Vec<String> = conn.prepare(
            "SELECT p.key FROM permissions p 
             JOIN role_permissions rp ON p.id = rp.permission_id 
             WHERE rp.role_id = ?"
        )?.query_map(&[&role], |row| row.get(0))?
        .filter_map(Result::ok)
        .collect();
        
        permissions.extend(role_perms);
    }
    
    // Agregar permisos específicos de usuario (donde granted = 1)
    let user_perms: Vec<String> = conn.prepare(
        "SELECT p.key FROM permissions p 
         JOIN user_permissions up ON p.id = up.permission_id 
         WHERE up.user_id = ? AND up.granted = 1"
    )?.query_map(&[&user_id], |row| row.get(0))?
    .filter_map(Result::ok)
    .collect();
    
    permissions.extend(user_perms);
    
    // Quitar permisos denegados específicamente para el usuario (donde granted = 0)
    let denied_perms: Vec<String> = conn.prepare(
        "SELECT p.key FROM permissions p 
         JOIN user_permissions up ON p.id = up.permission_id 
         WHERE up.user_id = ? AND up.granted = 0"
    )?.query_map(&[&user_id], |row| row.get(0))?
    .filter_map(Result::ok)
    .collect();
    
    permissions.retain(|p| !denied_perms.contains(p));
    
    // Si el usuario tiene el permiso "*", tiene todos los permisos
    if permissions.contains(&"*".to_string()) {
        // Obtener todos los permisos disponibles
        permissions = conn.prepare(
            "SELECT key FROM permissions WHERE status != 'Eliminado'"
        )?.query_map([], |row| row.get(0))?
        .filter_map(Result::ok)
        .collect();
    }
    
    Ok(permissions)
}

pub fn update_user_permissions(conn: &Connection, user_id: &str, permissions: &[String]) -> SQLiteResult<()> {
    // Iniciar transacción
    let tx = conn.transaction()?;
    
    // Eliminar permisos actuales del usuario
    tx.execute(
        "DELETE FROM user_permissions WHERE user_id = ?",
        &[&user_id],
    )?;
    
    // Insertar nuevos permisos
    for perm_key in permissions {
        // Obtener ID del permiso
        let permission = match Permission::find_by_key(&tx, perm_key) {
            Ok(p) => p,
            Err(_) => {
                // Si el permiso no existe, crearlo
                let id = Permission::create(&tx, perm_key, None, None)?;
                Permission {
                    id,
                    key: perm_key.clone(),
                    label: None,
                    description: None,
                    status: "Activo".to_string(),
                    deleted_at: None,
                    deleted_by: None,
                    created_at: chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
                }
            }
        };
        
        // Asignar permiso al usuario
        tx.execute(
            "INSERT INTO user_permissions (user_id, permission_id, granted) VALUES (?, ?, 1)",
            &[&user_id, &permission.id],
        )?;
    }
    
    // Confirmar transacción
    tx.commit()?;
    
    Ok(())
}

pub fn get_role_permissions(conn: &Connection, role_id: &str) -> SQLiteResult<Vec<String>> {
    let perms: Vec<String> = conn.prepare(
        "SELECT p.key FROM permissions p 
         JOIN role_permissions rp ON p.id = rp.permission_id 
         WHERE rp.role_id = ?"
    )?.query_map(&[&role_id], |row| row.get(0))?
    .filter_map(Result::ok)
    .collect();
    
    Ok(perms)
}

pub fn update_role_permissions(conn: &Connection, role_id: &str, permissions: &[String]) -> SQLiteResult<()> {
    // Iniciar transacción
    let tx = conn.transaction()?;
    
    // Eliminar permisos actuales del rol
    tx.execute(
        "DELETE FROM role_permissions WHERE role_id = ?",
        &[&role_id],
    )?;
    
    // Insertar nuevos permisos
    for perm_key in permissions {
        // Obtener ID del permiso
        let permission = match Permission::find_by_key(&tx, perm_key) {
            Ok(p) => p,
            Err(_) => {
                // Si el permiso no existe, crearlo
                let id = Permission::create(&tx, perm_key, None, None)?;
                Permission {
                    id,
                    key: perm_key.clone(),
                    label: None,
                    description: None,
                    status: "Activo".to_string(),
                    deleted_at: None,
                    deleted_by: None,
                    created_at: chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
                }
            }
        };
        
        // Asignar permiso al rol
        tx.execute(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
            &[&role_id, &permission.id],
        )?;
    }
    
    // Confirmar transacción
    tx.commit()?;
    
    Ok(())
}

// Función para obtener los metadatos de permisos (similar a permissionsMeta.ts)
pub fn get_permissions_metadata() -> Vec<PermissionMeta> {
    // Esta función devuelve la misma estructura que el frontend espera
    let metadata: Vec<PermissionMeta> = vec![
        PermissionMeta {
            key: "*".to_string(),
            label: "Acceso total".to_string(),
            description: "Permite todas las operaciones en la aplicación.".to_string(),
            category: "general".to_string(),
            affected: vec!["Todos".to_string()],
            requires: None,
        },
        // Permisos de ventas
        PermissionMeta {
            key: "sales:create".to_string(),
            label: "Crear ventas".to_string(),
            description: "Permite crear/registrar nuevas ventas.".to_string(),
            category: "ventas".to_string(),
            affected: vec!["Registrar Venta".to_string(), "Guardar Cambios".to_string()],
            requires: None,
        },
        // Se agregarían todos los permisos del sistema...
        // Aquí solo se muestran algunos como ejemplo
    ];
    
    metadata
}