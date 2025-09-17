// src-backend-rust/src/routes/role_permissions.rs

use actix_web::{web, HttpResponse, Responder, http::StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::json;
use rusqlite::Connection;
use crate::models::role_permission::{
    Role, Permission, PermissionMeta, 
    get_user_permissions, update_user_permissions, 
    get_role_permissions, update_role_permissions,
    get_permissions_metadata
};
use crate::database_manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct PermissionsRequest {
    permissions: Vec<String>,
}

// Configuración de rutas para permisos de roles
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            .route("/users/{id}/permissions", web::get().to(get_user_permissions_handler))
            .route("/users/{id}/permissions", web::put().to(update_user_permissions_handler))
            .route("/meta/permissions", web::get().to(get_permissions_metadata_handler))
    );
}

// Controladores

// Obtener permisos de un usuario
async fn get_user_permissions_handler(path: web::Path<String>, db_manager: web::Data<crate::database_manager::DatabaseManager>) -> impl Responder {
    let user_id = path.into_inner();
    
    // Obtener conexión a la base de datos
    let conn = match db_manager.get_connection() {
        Ok(conn) => conn,
        Err(e) => {
            return HttpResponse::InternalServerError().json(json!({
                "error": format!("Error de base de datos: {}", e)
            }));
        }
    };
    
    // Obtener permisos del usuario
    match get_user_permissions(&conn, &user_id) {
        Ok(permissions) => {
            HttpResponse::Ok().json(json!({
                "permissions": permissions
            }))
        },
        Err(e) => {
            HttpResponse::InternalServerError().json(json!({
                "error": format!("Error al obtener permisos: {}", e)
            }))
        }
    }
}

// Actualizar permisos de un usuario
async fn update_user_permissions_handler(
    path: web::Path<String>,
    permissions: web::Json<PermissionsRequest>,
    db_manager: web::Data<crate::database_manager::DatabaseManager>
) -> impl Responder {
    let user_id = path.into_inner();
    
    // Obtener conexión a la base de datos
    let mut conn = match db_manager.get_connection() {
        Ok(conn) => conn,
        Err(e) => {
            return HttpResponse::InternalServerError().json(json!({
                "error": format!("Error de base de datos: {}", e)
            }));
        }
    };
    
    // Actualizar permisos del usuario
    match update_user_permissions(&mut *conn, &user_id, &permissions.permissions) {
        Ok(_) => {
            HttpResponse::Ok().json(json!({
                "message": "Permisos actualizados correctamente"
            }))
        },
        Err(e) => {
            HttpResponse::InternalServerError().json(json!({
                "error": format!("Error al actualizar permisos: {}", e)
            }))
        }
    }
}

// Obtener metadatos de permisos
async fn get_permissions_metadata_handler() -> impl Responder {
    // Obtener metadatos de permisos
    let metadata = get_permissions_metadata();
    
    HttpResponse::Ok().json(json!({
        "permissions": metadata
    }))
}





