// src-backend-rust/src/routes/attributes.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use nanoid::nanoid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Attribute {
    id: Option<String>,
    name: String,
    description: Option<String>,
    type_value: Option<String>, // "text", "number", "select", etc.
    allowed_values: Option<Vec<String>>,
}

// Configuración de rutas para atributos
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/attributes")
            .route("", web::get().to(get_attributes))
            .route("/{id}", web::get().to(get_attribute))
            .route("", web::post().to(create_attribute))
            .route("/{id}", web::put().to(update_attribute))
            .route("/{id}", web::delete().to(delete_attribute))
    );
}

// Controladores

async fn get_attributes() -> impl Responder {
    // En una implementación real, consultaríamos la base de datos
    HttpResponse::Ok().json(json!([
        {
            "id": "1",
            "name": "Color",
            "description": "Color del producto",
            "type_value": "select",
            "allowed_values": ["Rojo", "Verde", "Azul", "Negro", "Blanco"]
        },
        {
            "id": "2",
            "name": "Talla",
            "description": "Talla del producto",
            "type_value": "select",
            "allowed_values": ["XS", "S", "M", "L", "XL", "XXL"]
        }
    ]))
}

async fn get_attribute(path: web::Path<String>) -> impl Responder {
    let attribute_id = path.into_inner();
    
    // En una implementación real, consultaríamos la base de datos por ID
    HttpResponse::Ok().json(json!({
        "id": attribute_id,
        "name": "Color",
        "description": "Color del producto",
        "type_value": "select",
        "allowed_values": ["Rojo", "Verde", "Azul", "Negro", "Blanco"]
    }))
}

async fn create_attribute(attribute: web::Json<Attribute>) -> impl Responder {
    // En una implementación real, insertaríamos en la base de datos
    let id = nanoid!(10);
    
    HttpResponse::Created().json(json!({
        "id": id,
        "name": attribute.name,
        "description": attribute.description,
        "type_value": attribute.type_value,
        "allowed_values": attribute.allowed_values,
        "created": true
    }))
}

async fn update_attribute(path: web::Path<String>, attribute: web::Json<Attribute>) -> impl Responder {
    let attribute_id = path.into_inner();
    
    // En una implementación real, actualizaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": attribute_id,
        "name": attribute.name,
        "description": attribute.description,
        "type_value": attribute.type_value,
        "allowed_values": attribute.allowed_values,
        "updated": true
    }))
}

async fn delete_attribute(path: web::Path<String>) -> impl Responder {
    let attribute_id = path.into_inner();
    
    // En una implementación real, eliminaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": attribute_id,
        "deleted": true
    }))
}