// src-backend-rust/src/routes/brands.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use nanoid::nanoid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Brand {
    id: Option<String>,
    name: String,
    description: Option<String>,
    logo_url: Option<String>,
}

// Configuración de rutas para marcas
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/brands")
            .route("", web::get().to(get_brands))
            .route("/{id}", web::get().to(get_brand))
            .route("", web::post().to(create_brand))
            .route("/{id}", web::put().to(update_brand))
            .route("/{id}", web::delete().to(delete_brand))
    );
}

// Controladores

async fn get_brands() -> impl Responder {
    // En una implementación real, consultaríamos la base de datos
    HttpResponse::Ok().json(json!([
        {
            "id": "1",
            "name": "Marca Ejemplo",
            "description": "Una marca de ejemplo",
            "logo_url": null
        },
        {
            "id": "2",
            "name": "Otra Marca",
            "description": "Otra marca de ejemplo",
            "logo_url": null
        }
    ]))
}

async fn get_brand(path: web::Path<String>) -> impl Responder {
    let brand_id = path.into_inner();
    
    // En una implementación real, consultaríamos la base de datos por ID
    HttpResponse::Ok().json(json!({
        "id": brand_id,
        "name": "Marca Ejemplo",
        "description": "Una marca de ejemplo",
        "logo_url": null
    }))
}

async fn create_brand(brand: web::Json<Brand>) -> impl Responder {
    // En una implementación real, insertaríamos en la base de datos
    let id = nanoid!(10);
    
    HttpResponse::Created().json(json!({
        "id": id,
        "name": brand.name,
        "description": brand.description,
        "logo_url": brand.logo_url,
        "created": true
    }))
}

async fn update_brand(path: web::Path<String>, brand: web::Json<Brand>) -> impl Responder {
    let brand_id = path.into_inner();
    
    // En una implementación real, actualizaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": brand_id,
        "name": brand.name,
        "description": brand.description,
        "logo_url": brand.logo_url,
        "updated": true
    }))
}

async fn delete_brand(path: web::Path<String>) -> impl Responder {
    let brand_id = path.into_inner();
    
    // En una implementación real, eliminaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": brand_id,
        "deleted": true
    }))
}