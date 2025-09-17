// src-backend-rust/src/routes/settings.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{error, debug};
use crate::database_manager::DbPool;
use crate::models::setting::{Setting, NewSetting, UpdateSetting};
use crate::lib::authorize::{Authorize, permissions};
use crate::models::role_permission::{Permission};

#[derive(Debug, Serialize, Deserialize)]
pub struct SettingRequest {
    value: serde_json::Value,
    description: Option<String>,
}

// Configuración de rutas para configuraciones del sistema
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/settings")
            .route("", web::get().to(get_all_settings))
            .route("/{key}", web::get().to(get_setting))
            .route("/{key}", web::put().to(update_setting))
            .route("", web::post().to(create_setting))
            .route("/{key}", web::delete().to(delete_setting))
            .route("/category/{category}", web::get().to(get_settings_by_category))
            .route("/store", web::get().to(get_store_settings))
            .route("/store", web::put().to(update_store_settings))
    );
}

// Controladores
async fn get_all_settings(
    db_pool: web::Data<DbPool>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::SETTINGS_VIEW) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para ver configuraciones"
        }));
    }
    
    let pool = db_pool.get_ref();
    
    match Setting::get_by_categories(pool) {
        Ok(settings) => HttpResponse::Ok().json(settings),
        Err(e) => {
            error!("Error al obtener configuraciones: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener configuraciones"
            }))
        }
    }
}

async fn get_setting(
    db_pool: web::Data<DbPool>,
    path: web::Path<String>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::SETTINGS_VIEW) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para ver configuraciones"
        }));
    }
    
    let pool = db_pool.get_ref();
    let key = path.into_inner();
    
    match Setting::find_by_key(pool, &key) {
        Ok(Some(setting)) => HttpResponse::Ok().json(setting),
        Ok(None) => HttpResponse::NotFound().json(json!({
            "error": format!("Configuración '{}' no encontrada", key)
        })),
        Err(e) => {
            error!("Error al obtener configuración: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener configuración"
            }))
        }
    }
}

async fn update_setting(
    db_pool: web::Data<DbPool>,
    path: web::Path<String>,
    body: web::Json<SettingRequest>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::SETTINGS_MANAGE) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para gestionar configuraciones"
        }));
    }
    
    let pool = db_pool.get_ref();
    let key = path.into_inner();
    
    let update = UpdateSetting {
        value: body.value.clone(),
        description: body.description.clone(),
    };
    
    match Setting::update(pool, &key, update) {
        Ok(setting) => {
            debug!("Configuración actualizada: {}", key);
            HttpResponse::Ok().json(setting)
        },
        Err(e) => {
            error!("Error al actualizar configuración: {}", e);
            
            // Manejar diferentes tipos de errores
            if let rusqlite::Error::SqliteFailure(_, Some(error_msg)) = &e {
                return HttpResponse::BadRequest().json(json!({
                    "error": error_msg
                }));
            }
            
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al actualizar configuración"
            }))
        }
    }
}

async fn create_setting(
    db_pool: web::Data<DbPool>,
    body: web::Json<NewSetting>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::SETTINGS_MANAGE) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para gestionar configuraciones"
        }));
    }
    
    let pool = db_pool.get_ref();
    
    match Setting::create(pool, body.into_inner()) {
        Ok(setting) => {
            debug!("Configuración creada: {}", setting.key);
            HttpResponse::Created().json(setting)
        },
        Err(e) => {
            error!("Error al crear configuración: {}", e);
            
            // Manejar diferentes tipos de errores
            if let rusqlite::Error::SqliteFailure(_, Some(error_msg)) = &e {
                return HttpResponse::BadRequest().json(json!({
                    "error": error_msg
                }));
            }
            
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al crear configuración"
            }))
        }
    }
}

async fn delete_setting(
    db_pool: web::Data<DbPool>,
    path: web::Path<String>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::SETTINGS_MANAGE) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para gestionar configuraciones"
        }));
    }
    
    let pool = db_pool.get_ref();
    let key = path.into_inner();
    
    match Setting::delete(pool, &key) {
        Ok(true) => {
            debug!("Configuración eliminada: {}", key);
            HttpResponse::Ok().json(json!({
                "success": true,
                "message": format!("Configuración '{}' eliminada correctamente", key)
            }))
        },
        Ok(false) => HttpResponse::NotFound().json(json!({
            "error": format!("Configuración '{}' no encontrada", key)
        })),
        Err(e) => {
            error!("Error al eliminar configuración: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al eliminar configuración"
            }))
        }
    }
}

async fn get_settings_by_category(
    db_pool: web::Data<DbPool>,
    path: web::Path<String>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::SETTINGS_VIEW) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para ver configuraciones"
        }));
    }
    
    let pool = db_pool.get_ref();
    let category = path.into_inner();
    
    match Setting::find_by_category(pool, &category) {
        Ok(settings) => {
            if settings.is_empty() {
                HttpResponse::Ok().json(json!({
                    "category": category,
                    "settings": []
                }))
            } else {
                HttpResponse::Ok().json(json!({
                    "category": category,
                    "settings": settings
                }))
            }
        },
        Err(e) => {
            error!("Error al obtener configuraciones por categoría: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener configuraciones por categoría"
            }))
        }
    }
}

async fn get_store_settings() -> impl Responder {
    // Simular configuraciones de tienda
    HttpResponse::Ok().json(json!({
        "name": "Mi Tienda",
        "address": "Calle Principal 123",
        "phone": "123-456-7890",
        "email": "contacto@mitienda.com",
        "currency": "USD",
        "tax_rate": 16.0,
        "low_stock_alert": 5,
        "auto_backup": true,
        "receipt_footer": "Gracias por su compra"
    }))
}

async fn update_store_settings(
    settings: web::Json<serde_json::Value>
) -> impl Responder {
    // Simular actualización de configuraciones
    HttpResponse::Ok().json(json!({
        "success": true,
        "message": "Configuraciones de tienda actualizadas",
        "settings": settings.into_inner()
    }))
}

