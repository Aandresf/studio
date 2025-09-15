// src-backend-rust/src/routes/settings.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
pub struct Setting {
    key: String,
    value: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SettingUpdate {
    value: serde_json::Value,
}

// Configuración de rutas para configuraciones del sistema
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/settings")
            .route("", web::get().to(get_all_settings))
            .route("/{key}", web::get().to(get_setting))
            .route("/{key}", web::put().to(update_setting))
            .route("/category/{category}", web::get().to(get_settings_by_category))
    );
}

// Controladores

async fn get_all_settings() -> impl Responder {
    // En una implementación real, obtendríamos todas las configuraciones de la base de datos
    
    HttpResponse::Ok().json(json!({
        "general": {
            "company_name": "Mi Empresa",
            "currency": "MXN",
            "language": "es",
            "timezone": "America/Mexico_City",
            "decimal_places": 2
        },
        "invoicing": {
            "auto_generate": true,
            "prefix": "INV",
            "next_number": 1001,
            "include_logo": true,
            "terms_and_conditions": "Términos y condiciones predeterminados..."
        },
        "inventory": {
            "enable_low_stock_alerts": true,
            "default_low_stock_threshold": 5,
            "auto_update_costs": true,
            "track_serial_numbers": false
        },
        "security": {
            "session_timeout_minutes": 30,
            "password_expiry_days": 90,
            "allow_concurrent_sessions": true,
            "enable_two_factor_auth": false
        },
        "appearance": {
            "theme": "light",
            "accent_color": "#1976D2",
            "show_help_tooltips": true,
            "compact_mode": false
        }
    }))
}

async fn get_setting(path: web::Path<String>) -> impl Responder {
    let key = path.into_inner();
    
    // En una implementación real, obtendríamos la configuración específica de la base de datos
    let setting_value = match key.as_str() {
        "company_name" => json!("Mi Empresa"),
        "currency" => json!("MXN"),
        "language" => json!("es"),
        "theme" => json!("light"),
        "decimal_places" => json!(2),
        "auto_generate_invoices" => json!(true),
        _ => return HttpResponse::NotFound().json(json!({
            "error": format!("Configuración '{}' no encontrada", key)
        }))
    };
    
    HttpResponse::Ok().json(json!({
        "key": key,
        "value": setting_value
    }))
}

async fn update_setting(path: web::Path<String>, body: web::Json<SettingUpdate>) -> impl Responder {
    let key = path.into_inner();
    
    // En una implementación real, actualizaríamos la configuración en la base de datos
    
    HttpResponse::Ok().json(json!({
        "key": key,
        "value": body.value,
        "updated": true,
        "message": format!("Configuración '{}' actualizada correctamente", key)
    }))
}

async fn get_settings_by_category(path: web::Path<String>) -> impl Responder {
    let category = path.into_inner();
    
    // En una implementación real, obtendríamos las configuraciones por categoría
    let settings = match category.as_str() {
        "general" => json!({
            "company_name": "Mi Empresa",
            "currency": "MXN",
            "language": "es",
            "timezone": "America/Mexico_City",
            "decimal_places": 2
        }),
        "invoicing" => json!({
            "auto_generate": true,
            "prefix": "INV",
            "next_number": 1001,
            "include_logo": true,
            "terms_and_conditions": "Términos y condiciones predeterminados..."
        }),
        "inventory" => json!({
            "enable_low_stock_alerts": true,
            "default_low_stock_threshold": 5,
            "auto_update_costs": true,
            "track_serial_numbers": false
        }),
        "security" => json!({
            "session_timeout_minutes": 30,
            "password_expiry_days": 90,
            "allow_concurrent_sessions": true,
            "enable_two_factor_auth": false
        }),
        "appearance" => json!({
            "theme": "light",
            "accent_color": "#1976D2",
            "show_help_tooltips": true,
            "compact_mode": false
        }),
        _ => return HttpResponse::NotFound().json(json!({
            "error": format!("Categoría '{}' no encontrada", category)
        }))
    };
    
    HttpResponse::Ok().json(json!({
        "category": category,
        "settings": settings
    }))
}