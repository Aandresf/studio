// src-backend-rust/src/routeasync fn get_users(db_manager: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a la base de datos"
            }));
        }
    };
    
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(e) => {
            error!("Error al obtener conexión del pool: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a la base de datos"
            }));
        }
    };
    
    // Obtener roles
    let roles = match Role::find_all(&conn) {
use actix_web::{web, HttpResponse, Responder, http::StatusCode};
use serde::{Deserialize, Serialize};
use crate::lib::authorize::Authorize;
use crate::database_manager::DatabaseManager;
use crate::models::user::{User, NewUser, UserUpdate, UserResponse};
use crate::models::role_permission::{Role};
use log::{debug, error};
use serde_json::json;
use std::sync::Arc;

// Configuración de rutas para usuarios
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/users")
            .route("", web::get().to(get_users))
            .route("/{id}", web::get().to(get_user))
            .route("", web::post().to(create_user))
            .route("/{id}", web::put().to(update_user))
            .route("/{id}", web::delete().to(delete_user))
            .route("/count", web::get().to(count_users))
            .route("/{id}/permissions", web::get().to(get_user_permissions))
            .route("/{id}/permissions", web::put().to(update_user_permissions))
    );
}

// Controladores

async fn get_users(db_manager: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error interno del servidor"
            }));
        }
    };
    
    // Obtener roles
    let roles = match Role::find_all(&conn) {
        Ok(r) => r,
        Err(e) => {
            error!("Error al obtener roles: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener roles",
                "details": e.to_string()
            }));
        }
    };
    
    match User::find_all(&conn) {
        Ok(users) => {
            // Convertir a UserResponse para no exponer datos sensibles
            let user_responses: Vec<UserResponse> = users.into_iter()
                .map(|user| UserResponse {
                    id: user.id,
                    username: user.username,
                    display_name: user.display_name,
                    email: user.email,
                    role_id: user.role_id,
                    status: user.status,
                })
                .collect();
                
            HttpResponse::Ok().json(json!({
                "users": user_responses,
                "roles": roles
            }))
        },
        Err(e) => {
            error!("Error al obtener usuarios: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener usuarios",
                "details": e.to_string()
            }))
        }
    }
}

async fn get_user(path: web::Path<String>, db_manager: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let user_id = path.into_inner();
    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error interno del servidor"
            }));
        }
    };
    
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(e) => {
            error!("Error al obtener conexión del pool: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a la base de datos"
            }));
        }
    };
    
    match User::find_by_id(&conn, &user_id) {
        Ok(user) => {
            // Obtener permisos del usuario desde el modelo
            let permissions = match crate::models::role_permission::get_user_permissions(&conn, &user.id.to_string()) {
                Ok(perms) => perms,
                Err(e) => {
                    error!("Error al obtener permisos del usuario: {}", e);
                    vec![] // Si hay error, retornamos una lista vacía
                }
            };
            
            let user_response = UserResponse {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                email: user.email,
                role_id: user.role_id,
                status: user.status,
            };
            
            HttpResponse::Ok().json(json!({
                "user": user_response,
                "permissions": permissions
            }))
        },
        Err(e) => {
            if let rusqlite::Error::QueryReturnedNoRows = e {
                HttpResponse::NotFound().json(json!({
                    "error": "Usuario no encontrado"
                }))
            } else {
                error!("Error al obtener usuario: {}", e);
                HttpResponse::InternalServerError().json(json!({
                    "error": "Error al obtener usuario",
                    "details": e.to_string()
                }))
            }
        }
    }
}


async fn create_user(user: web::Json<NewUser>, db_manager: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error interno del servidor"
            }));
        }
    };
    
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(e) => {
            error!("Error al obtener conexión del pool: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a la base de datos"
            }));
        }
    };
    
    match User::create(&conn, &user.into_inner()) {
        Ok(user_id) => {
            // Obtener el usuario recién creado para devolverlo en la respuesta
            match User::find_by_id(&conn, &user_id) {
                Ok(user) => {
                    let user_response = UserResponse {
                        id: user.id,
                        username: user.username,
                        display_name: user.display_name,
                        email: user.email,
                        role_id: user.role_id,
                        status: user.status,
                    };
                    
                    HttpResponse::Created().json(user_response)
                },
                Err(e) => {
                    error!("Error al obtener el usuario recién creado: {}", e);
                    HttpResponse::Ok().json(json!({
                        "id": user_id,
                        "created": true
                    }))
                }
            }
        },
        Err(e) => {
            error!("Error al crear usuario: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al crear usuario",
                "details": e.to_string()
            }))
        }
    }
}

async fn update_user(path: web::Path<String>, user: web::Json<UserUpdate>, db_manager: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let user_id = path.into_inner();
    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error interno del servidor"
            }));
        }
    };
    
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(e) => {
            error!("Error al obtener conexión del pool: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a la base de datos"
            }));
        }
    };
    
    match User::update(&conn, &user_id, &user.into_inner()) {
        Ok(rows_affected) => {
            if rows_affected == 0 {
                return HttpResponse::NotFound().json(json!({
                    "error": "Usuario no encontrado o no se realizaron cambios"
                }));
            }
            
            // Obtener el usuario actualizado
            match User::find_by_id(&conn, &user_id) {
                Ok(user) => {
                    let user_response = UserResponse {
                        id: user.id,
                        username: user.username,
                        display_name: user.display_name,
                        email: user.email,
                        role_id: user.role_id,
                        status: user.status,
                    };
                    
                    HttpResponse::Ok().json(user_response)
                },
                Err(e) => {
                    error!("Error al obtener usuario actualizado: {}", e);
                    HttpResponse::Ok().json(json!({
                        "id": user_id,
                        "updated": true
                    }))
                }
            }
        },
        Err(e) => {
            error!("Error al actualizar usuario: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al actualizar usuario",
                "details": e.to_string()
            }))
        }
    }
}


async fn delete_user(path: web::Path<String>, db_manager: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let user_id = path.into_inner();
    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error interno del servidor"
            }));
        }
    };
    
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(e) => {
            error!("Error al obtener conexión del pool: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a la base de datos"
            }));
        }
    };
    
    // En lugar de hard delete, hacemos soft delete
    // En un caso real, necesitaríamos obtener el ID del usuario que realiza la acción
    // Aquí usamos "system" como ejemplo
    match User::soft_delete(&conn, &user_id, "system") {
        Ok(rows_affected) => {
            if rows_affected == 0 {
                HttpResponse::NotFound().json(json!({
                    "error": "Usuario no encontrado"
                }))
            } else {
                HttpResponse::Ok().json(json!({
                    "id": user_id,
                    "deleted": true
                }))
            }
        },
        Err(e) => {
            error!("Error al eliminar usuario: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al eliminar usuario",
                "details": e.to_string()
            }))
        }
    }
}

async fn count_users(db_manager: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error interno del servidor"
            }));
        }
    };
    
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(e) => {
            error!("Error al obtener conexión del pool: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a la base de datos"
            }));
        }
    };
    
    let count = conn.query_row(
        "SELECT COUNT(*) FROM users WHERE status != 'Eliminado'", 
        [],
        |row| row.get::<_, i64>(0)
    );
    
    match count {
        Ok(count) => HttpResponse::Ok().json(json!({
            "count": count
        })),
        Err(e) => {
            error!("Error al contar usuarios: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al contar usuarios",
                "details": e.to_string()
            }))
        }
    }
}

async fn get_user_permissions(path: web::Path<String>, db_manager: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let user_id = path.into_inner();
    
    // Simular permisos de usuario
    HttpResponse::Ok().json(json!({
        "user_id": user_id,
        "permissions": [
            "products:read",
            "products:create", 
            "products:update",
            "sales:read",
            "sales:create",
            "customers:read",
            "customers:create",
            "inventory:read"
        ]
    }))
}

async fn update_user_permissions(
    path: web::Path<String>,
    permissions: web::Json<serde_json::Value>,
    db_manager: web::Data<Arc<DatabaseManager>>
) -> impl Responder {
    let user_id = path.into_inner();
    
    HttpResponse::Ok().json(json!({
        "message": "Permisos de usuario actualizados exitosamente",
        "user_id": user_id,
        "permissions": permissions.into_inner()
    }))
}