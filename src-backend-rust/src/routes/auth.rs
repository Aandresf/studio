// src-backend-rust/src/routes/auth.rs

use actix_web::{web, HttpResponse, Responder, cookie::{Cookie, SameSite}, HttpRequest};
use serde_json::json;
use std::sync::Arc;
use crate::models::{AuthRequest, AuthResponse, User};
use crate::database_manager::DatabaseManager;
use crate::lib::jwt;
use log::{info, error};

// Configuración de rutas para autenticación
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/auth")
            .route("/login", web::post().to(login))
            .route("/logout", web::post().to(logout))
            .route("/verify", web::post().to(verify_token))
            .route("/status", web::get().to(status))
            .route("/me", web::get().to(status)) // Alias para compatibilidad con frontend
    );
}

// Controladores

async fn login(
    auth_data: web::Json<AuthRequest>,
    db_manager: web::Data<std::sync::Arc<DatabaseManager>>,
    config: web::Data<crate::config::Settings>,
) -> impl Responder {
    info!("Iniciando proceso de login para usuario: {}", auth_data.username);
    
    // Obtener una conexión de la base de datos
    let conn = match db_manager.get_connection() {
        Ok(conn) => {
            info!("Conexión a BD obtenida exitosamente");
            conn
        },
        Err(e) => {
            error!("Error al obtener conexión de BD: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };
    
    info!("Intentando autenticar usuario: {}", auth_data.username);
    
    // Autenticar usuario
    let auth_result = match User::authenticate(&conn, &auth_data) {
        Ok(result) => {
            info!("Autenticación completada");
            result
        },
        Err(e) => {
            error!("Error en autenticación: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de autenticación"
            }));
        }
    };
    
    // Verificar si las credenciales son correctas
    match auth_result {
        Some(user) => {
            info!("Usuario encontrado: {} (status: {})", user.username, user.status);
            
            if user.status != "Activo" {
                error!("Usuario no activo: {}", user.status);
                return HttpResponse::Forbidden().json(json!({
                    "error": "Usuario desactivado o eliminado"
                }));
            }
            
            info!("Generando token JWT para usuario: {}", user.username);
            
            // Generar token JWT
            let token = match jwt::generate_token(&user.id, &user.username, user.role_id.as_deref(), &config.jwt_secret) {
                Ok(token) => {
                    info!("Token JWT generado exitosamente");
                    token
                },
                Err(e) => {
                    error!("Error generando token: {}", e);
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Error generando token de autenticación"
                    }));
                }
            };
            
            // Crear cookie de sesión
            let cookie = Cookie::build("session", token.clone())
                .path("/")
                .http_only(true)
                .same_site(SameSite::Lax)
                .finish();
            
            // Devolver respuesta con token y datos de usuario
            let response = AuthResponse {
                token,
                user: user.to_response(),
            };
            
            info!("Usuario {} autenticado correctamente", user.username);
            HttpResponse::Ok()
                .cookie(cookie)
                .json(response)
        },
        None => {
            // Credenciales incorrectas
            HttpResponse::Unauthorized().json(json!({
                "error": "Credenciales inválidas"
            }))
        }
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

async fn verify_token(
    token: web::Json<serde_json::Value>,
    config: web::Data<crate::config::Settings>,
) -> impl Responder {
    // Extraer token de la solicitud
    let token_str = match token.get("token") {
        Some(t) => match t.as_str() {
            Some(s) => s,
            None => {
                return HttpResponse::BadRequest().json(json!({
                    "error": "Token inválido"
                }));
            }
        },
        None => {
            return HttpResponse::BadRequest().json(json!({
                "error": "Token no proporcionado"
            }));
        }
    };
    
    // Validar token
    match jwt::validate_token(token_str, &config.jwt_secret) {
        Ok(claims) => {
            // Token válido
            HttpResponse::Ok().json(json!({
                "valid": true,
                "user": {
                    "id": claims.user_id,
                    "username": claims.sub,
                    "role_id": claims.role_id
                }
            }))
        },
        Err(e) => {
            // Token inválido
            error!("Error al validar token: {}", e);
            HttpResponse::Unauthorized().json(json!({
                "valid": false,
                "error": "Token inválido o expirado"
            }))
        }
    }
}

async fn status(
    config: web::Data<crate::config::Settings>,
    req: HttpRequest,
) -> impl Responder {
    // Intentar obtener el token de la cookie
    let token = match req.cookie("session") {
        Some(cookie) => cookie.value().to_string(),
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "authenticated": false,
                "message": "No hay sesión activa"
            }));
        }
    };
    
    // Validar token
    match jwt::validate_token(&token, &config.jwt_secret) {
        Ok(claims) => {
            // Token válido
            HttpResponse::Ok().json(json!({
                "authenticated": true,
                "user": {
                    "id": claims.user_id,
                    "username": claims.sub,
                    "role_id": claims.role_id
                }
            }))
        },
        Err(_) => {
            // Token inválido
            HttpResponse::Unauthorized().json(json!({
                "authenticated": false,
                "message": "Sesión inválida o expirada"
            }))
        }
    }
}

