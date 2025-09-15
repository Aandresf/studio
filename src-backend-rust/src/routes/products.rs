// src-backend-rust/src/routes/products.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use crate::lib::authorize::Authorize;
use rusqlite::{params, Connection};
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
pub struct Product {
    id: Option<String>,
    name: String,
    description: Option<String>,
    sku: Option<String>,
    barcode: Option<String>,
    cost_price: Option<f64>,
    sales_price: Option<f64>,
    stock: Option<f64>,
    department_id: Option<String>,
    subdepartment_id: Option<String>,
    brand_id: Option<String>,
}

// Configuración de rutas para productos
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/products")
            .route("", web::get().to(get_products))
            .route("/{id}", web::get().to(get_product))
            .route("", web::post().to(create_product))
            .route("/{id}", web::put().to(update_product))
            .route("/{id}", web::delete().to(delete_product))
    );
}

// Controladores

async fn get_products() -> impl Responder {
    // Esto es un ejemplo muy básico.
    // En una implementación real, se consultaría la base de datos.
    HttpResponse::Ok().json(json!([
        {
            "id": "1",
            "name": "Producto de ejemplo",
            "description": "Descripción del producto",
            "sku": "SKU123",
            "cost_price": 100.0,
            "sales_price": 150.0,
            "stock": 10.0
        }
    ]))
}

async fn get_product(path: web::Path<String>) -> impl Responder {
    let product_id = path.into_inner();
    
    // En una implementación real, se consultaría la base de datos por ID
    HttpResponse::Ok().json(json!({
        "id": product_id,
        "name": "Producto individual",
        "description": "Descripción del producto individual",
        "sku": "SKU456",
        "cost_price": 200.0,
        "sales_price": 250.0,
        "stock": 5.0
    }))
}

async fn create_product(product: web::Json<Product>) -> impl Responder {
    // En una implementación real, se insertaría en la base de datos
    HttpResponse::Created().json(json!({
        "id": "nuevo-id",
        "name": product.name,
        "description": product.description,
        "sku": product.sku,
        "cost_price": product.cost_price,
        "sales_price": product.sales_price,
        "stock": product.stock
    }))
}

async fn update_product(path: web::Path<String>, product: web::Json<Product>) -> impl Responder {
    let product_id = path.into_inner();
    
    // En una implementación real, se actualizaría en la base de datos
    HttpResponse::Ok().json(json!({
        "id": product_id,
        "name": product.name,
        "description": product.description,
        "sku": product.sku,
        "cost_price": product.cost_price,
        "sales_price": product.sales_price,
        "stock": product.stock,
        "updated": true
    }))
}

async fn delete_product(path: web::Path<String>) -> impl Responder {
    let product_id = path.into_inner();
    
    // En una implementación real, se eliminaría de la base de datos
    HttpResponse::Ok().json(json!({
        "id": product_id,
        "deleted": true
    }))
}