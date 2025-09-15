// src-backend-rust/src/routes/users.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use crate::lib::authorize::Authorize;
use nanoid::nanoid;
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    id: Option<String>,
    username: String,
    password: Option<String>,
    display_name: Option<String>,
    role_id: String,
}

// Configuración de rutas para usuarios
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/users")
            .route("", web::get().to(get_users))
            .route("/{id}", web::get().to(get_user))
            .route("", web::post().to(create_user))
            .route("/{id}", web::put().to(update_user))
            .route("/{id}", web::delete().to(delete_user))
    );
}

// Controladores

async fn get_users() -> impl Responder {
    // En una implementación real, consultaríamos la base de datos
    HttpResponse::Ok().json(json!([
        {
            "id": "1",
            "username": "admin",
            "display_name": "Administrador",
            "role_id": "admin"
        },
        {
            "id": "2",
            "username": "vendedor",
            "display_name": "Vendedor",
            "role_id": "sales"
        }
    ]))
}

async fn get_user(path: web::Path<String>) -> impl Responder {
    let user_id = path.into_inner();
    
    // En una implementación real, consultaríamos la base de datos por ID
    HttpResponse::Ok().json(json!({
        "id": user_id,
        "username": "usuario_ejemplo",
        "display_name": "Usuario de Ejemplo",
        "role_id": "staff"
    }))
}

async fn create_user(user: web::Json<User>) -> impl Responder {
    // En una implementación real, insertaríamos en la base de datos
    // y hashearíamos la contraseña
    
    let id = nanoid!(10);
    
    HttpResponse::Created().json(json!({
        "id": id,
        "username": user.username,
        "display_name": user.display_name,
        "role_id": user.role_id,
        "created": true
    }))
}

async fn update_user(path: web::Path<String>, user: web::Json<User>) -> impl Responder {
    let user_id = path.into_inner();
    
    // En una implementación real, actualizaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": user_id,
        "username": user.username,
        "display_name": user.display_name,
        "role_id": user.role_id,
        "updated": true
    }))
}

async fn delete_user(path: web::Path<String>) -> impl Responder {
    let user_id = path.into_inner();
    
    // En una implementación real, eliminaríamos o desactivaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": user_id,
        "deleted": true
    }))
}