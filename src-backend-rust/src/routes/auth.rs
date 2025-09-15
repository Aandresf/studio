// src-backend-rust/src/routes/auth.rs

use actix_web::{web, HttpResponse, Responder, cookie::{Cookie, SameSite}};
use serde::{Deserialize, Serialize};
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use chrono::{Utc, Duration};
use std::env;
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    sub: String,        // subject (user ID)
    username: String,   // username
    role: String,       // role ID
    exp: usize,         // expiration time
}

// Configuración de rutas para autenticación
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/auth")
            .route("/login", web::post().to(login))
            .route("/logout", web::post().to(logout))
            .route("/status", web::get().to(status))
    );
}

// Controladores

async fn login(login_data: web::Json<LoginRequest>) -> impl Responder {
    // En una implementación real, verificaríamos las credenciales en la BD
    // y generaríamos un JWT real
    
    // Este es un ejemplo simplificado
    if login_data.username == "admin" && login_data.password == "password" {
        // Crear token JWT
        let claims = Claims {
            sub: "1".to_string(),
            username: login_data.username.clone(),
            role: "admin".to_string(),
            exp: (Utc::now() + Duration::hours(24)).timestamp() as usize,
        };
        
        let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your_jwt_secret_key".to_string());
        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret.as_bytes())
        ).unwrap();
        
        // Crear cookie de sesión
        let cookie = Cookie::build("session", token.clone())
            .path("/")
            .http_only(true)
            .same_site(SameSite::Lax)
            .finish();
        
        // Devolver respuesta con cookie y datos del usuario
        HttpResponse::Ok()
            .cookie(cookie)
            .json(json!({
                "success": true,
                "user": {
                    "id": "1",
                    "username": login_data.username,
                    "display_name": "Administrador",
                    "role": "admin",
                    "permissions": ["manage_products", "manage_inventory", "manage_sales"]
                },
                "token": token
            }))
    } else {
        HttpResponse::Unauthorized().json(json!({
            "success": false,
            "message": "Credenciales inválidas"
        }))
    }
}

async fn logout() -> impl Responder {
    // Crear cookie vacía con tiempo de expiración en el pasado para eliminarla
    let cookie = Cookie::build("session", "")
        .path("/")
        .max_age(actix_web::cookie::time::Duration::new(-1, 0))
        .http_only(true)
        .finish();
    
    HttpResponse::Ok()
        .cookie(cookie)
        .json(json!({
            "success": true,
            "message": "Sesión cerrada correctamente"
        }))
}

async fn status() -> impl Responder {
    // En una implementación real, verificaríamos el token JWT
    // y devolveríamos la información del usuario
    
    // Este es un ejemplo simplificado que siempre devuelve no autenticado
    HttpResponse::Ok().json(json!({
        "authenticated": false
    }))
}