// src-backend-rust/src/routes/users.rs

use actix_web::{web, HttpResponse, Responder, http::StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;
use log::{debug, error};
use crate::database_manager::DatabaseManager;
use crate::models::user::{User, NewUser, UserUpdate, UserResponse};

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
    );
}

// Controladores

async fn get_users(web::Query(params): web::Query<serde_json::Value>, db_manager: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error interno del servidor"
            }));
        }
    };
    
    // Extraer parámetros de paginación
    let limit = params["limit"].as_i64();
    let offset = params["offset"].as_i64();
    
    match User::find_all(&pool.get().unwrap(), limit, offset) {
        Ok(users) => {
            debug!("Usuarios obtenidos exitosamente: {} registros", users.len());
            HttpResponse::Ok().json(users)
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
    
    match User::find_by_id(&pool.get().unwrap(), &user_id) {
        Ok(Some(user)) => {
            debug!("Usuario encontrado: {}", user_id);
            HttpResponse::Ok().json(user)
        },
        Ok(None) => {
            debug!("Usuario no encontrado: {}", user_id);
            HttpResponse::NotFound().json(json!({
                "error": "Usuario no encontrado"
            }))
        },
        Err(e) => {
            error!("Error al buscar usuario {}: {}", user_id, e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al buscar usuario",
                "details": e.to_string()
            }))
        }
    }
}

async fn create_user(user_data: web::Json<NewUser>, db_manager: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error interno del servidor"
            }));
        }
    };
    
    match User::create(&pool.get().unwrap(), &user_data.into_inner()) {
        Ok(user) => {
            debug!("Usuario creado exitosamente: {}", user.username);
            HttpResponse::Created().json(user)
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

async fn update_user(path: web::Path<String>, user_data: web::Json<UserUpdate>, db_manager: web::Data<Arc<DatabaseManager>>) -> impl Responder {
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
    
    match User::update(&pool.get().unwrap(), &user_id, &user_data.into_inner()) {
        Ok(user) => {
            debug!("Usuario actualizado exitosamente: {}", user_id);
            HttpResponse::Ok().json(user)
        },
        Err(e) => {
            error!("Error al actualizar usuario {}: {}", user_id, e);
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
    
    match User::soft_delete(&pool.get().unwrap(), &user_id, "admin") {
        Ok(_) => {
            debug!("Usuario eliminado exitosamente: {}", user_id);
            HttpResponse::Ok().json(json!({
                "message": "Usuario eliminado exitosamente"
            }))
        },
        Err(e) => {
            error!("Error al eliminar usuario {}: {}", user_id, e);
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
    
    match User::count_all(&pool.get().unwrap()) {
        Ok(count) => {
            debug!("Conteo de usuarios exitoso: {}", count);
            HttpResponse::Ok().json(json!({
                "count": count
            }))
        },
        Err(e) => {
            error!("Error al contar usuarios: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al contar usuarios",
                "details": e.to_string()
            }))
        }
    }
}