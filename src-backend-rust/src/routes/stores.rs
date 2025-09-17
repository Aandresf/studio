// src-backend-rust/src/routes/stores.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use nanoid::nanoid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Store {
    id: Option<String>,
    name: String,
    address: Option<String>,
    phone: Option<String>,
    tax_id: Option<String>,
    is_active: Option<bool>,
}

// Configuración de rutas para tiendas
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/stores")
            .route("", web::get().to(get_stores))
            .route("/active", web::get().to(get_active_store))
            .route("/active", web::put().to(set_active_store))
            .route("/active", web::post().to(set_active_store)) // Alias para frontend
            .route("/{id}", web::get().to(get_store))
            .route("", web::post().to(create_store))
            .route("/{id}", web::put().to(update_store))
            .route("/{id}", web::delete().to(delete_store))
            .route("/{id}/details", web::get().to(get_store_details))
            .route("/{id}/details", web::put().to(update_store_details))
    );
}

// Controladores

async fn get_stores() -> impl Responder {
    // En una implementación real, consultaríamos la base de datos
    HttpResponse::Ok().json(json!([
        {
            "id": "1",
            "name": "Tienda Principal",
            "address": "Calle Comercio 123",
            "phone": "123456789",
            "tax_id": "12345678-9",
            "is_active": true
        },
        {
            "id": "2",
            "name": "Sucursal Norte",
            "address": "Avenida Norte 456",
            "phone": "987654321",
            "tax_id": "98765432-1",
            "is_active": false
        }
    ]))
}

async fn get_store(path: web::Path<String>) -> impl Responder {
    let store_id = path.into_inner();
    
    // En una implementación real, consultaríamos la base de datos por ID
    HttpResponse::Ok().json(json!({
        "id": store_id,
        "name": "Tienda Principal",
        "address": "Calle Comercio 123",
        "phone": "123456789",
        "tax_id": "12345678-9",
        "is_active": true
    }))
}

async fn get_active_store() -> impl Responder {
    // En una implementación real, consultaríamos la tienda activa de la configuración
    HttpResponse::Ok().json(json!({
        "id": "1",
        "name": "Tienda Principal",
        "address": "Calle Comercio 123",
        "phone": "123456789",
        "tax_id": "12345678-9",
        "is_active": true
    }))
}

async fn set_active_store(store_id: web::Json<String>) -> impl Responder {
    // En una implementación real, actualizaríamos la tienda activa en la configuración
    HttpResponse::Ok().json(json!({
        "id": store_id.0,
        "active": true,
        "success": true
    }))
}

async fn create_store(store: web::Json<Store>) -> impl Responder {
    // En una implementación real, insertaríamos en la base de datos
    let id = nanoid!(10);
    
    HttpResponse::Created().json(json!({
        "id": id,
        "name": store.name,
        "address": store.address,
        "phone": store.phone,
        "tax_id": store.tax_id,
        "is_active": store.is_active.unwrap_or(false),
        "created": true
    }))
}

async fn update_store(path: web::Path<String>, store: web::Json<Store>) -> impl Responder {
    let store_id = path.into_inner();
    
    // En una implementación real, actualizaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": store_id,
        "name": store.name,
        "address": store.address,
        "phone": store.phone,
        "tax_id": store.tax_id,
        "is_active": store.is_active,
        "updated": true
    }))
}

async fn delete_store(path: web::Path<String>) -> impl Responder {
    let store_id = path.into_inner();
    
    // En una implementación real, eliminaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": store_id,
        "deleted": true
    }))
}

async fn get_store_details(path: web::Path<String>) -> impl Responder {
    let store_id = path.into_inner();
    
    HttpResponse::Ok().json(json!({
        "id": store_id,
        "name": "Mi Tienda Principal",
        "address": "Calle Principal 123, Ciudad",
        "phone": "+1 234-567-8900",
        "email": "contacto@mitienda.com",
        "tax_id": "123456789",
        "currency": "USD",
        "timezone": "America/Mexico_City",
        "business_hours": {
            "monday": "09:00-18:00",
            "tuesday": "09:00-18:00", 
            "wednesday": "09:00-18:00",
            "thursday": "09:00-18:00",
            "friday": "09:00-18:00",
            "saturday": "10:00-14:00",
            "sunday": "closed"
        }
    }))
}

async fn update_store_details(
    path: web::Path<String>,
    details: web::Json<serde_json::Value>
) -> impl Responder {
    let store_id = path.into_inner();
    
    HttpResponse::Ok().json(json!({
        "message": "Detalles de tienda actualizados exitosamente",
        "store_id": store_id,
        "updated_details": details.into_inner()
    }))
}