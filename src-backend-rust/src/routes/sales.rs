// src-backend-rust/src/routes/sales.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use crate::lib::authorize::Authorize;
use nanoid::nanoid;
use serde_json::json;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize)]
pub struct SaleItem {
    product_id: String,
    quantity: f64,
    price: f64,
    discount: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Sale {
    id: Option<String>,
    customer_id: Option<String>,
    items: Vec<SaleItem>,
    total: f64,
    payment_method: String,
    notes: Option<String>,
}

// Configuración de rutas para ventas
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/sales")
            .route("", web::get().to(get_sales))
            .route("/{id}", web::get().to(get_sale))
            .route("", web::post().to(create_sale))
            .route("/{id}/annul", web::post().to(annul_sale))
    );
}

// Controladores

async fn get_sales() -> impl Responder {
    // En una implementación real, consultaríamos la base de datos
    HttpResponse::Ok().json(json!([
        {
            "id": "V001",
            "date": "2023-09-15T10:30:00Z",
            "customer_id": "C001",
            "customer_name": "Cliente Ejemplo",
            "total": 1500.0,
            "status": "completed"
        },
        {
            "id": "V002",
            "date": "2023-09-15T14:45:00Z",
            "customer_id": null,
            "customer_name": "Venta General",
            "total": 750.0,
            "status": "completed"
        }
    ]))
}

async fn get_sale(path: web::Path<String>) -> impl Responder {
    let sale_id = path.into_inner();
    
    // En una implementación real, consultaríamos la base de datos por ID
    HttpResponse::Ok().json(json!({
        "id": sale_id,
        "date": "2023-09-15T10:30:00Z",
        "customer_id": "C001",
        "customer_name": "Cliente Ejemplo",
        "items": [
            {
                "product_id": "P001",
                "product_name": "Producto 1",
                "quantity": 2.0,
                "price": 500.0,
                "discount": 0.0,
                "subtotal": 1000.0
            },
            {
                "product_id": "P002",
                "product_name": "Producto 2",
                "quantity": 1.0,
                "price": 500.0,
                "discount": 0.0,
                "subtotal": 500.0
            }
        ],
        "total": 1500.0,
        "payment_method": "efectivo",
        "notes": null,
        "status": "completed"
    }))
}

async fn create_sale(sale: web::Json<Sale>) -> impl Responder {
    // En una implementación real, insertaríamos en la base de datos
    // y actualizaríamos el inventario
    
    let sale_id = format!("V{}", nanoid!(6));
    let now = Utc::now().to_rfc3339();
    
    HttpResponse::Created().json(json!({
        "id": sale_id,
        "date": now,
        "customer_id": sale.customer_id,
        "items": sale.items,
        "total": sale.total,
        "payment_method": sale.payment_method,
        "notes": sale.notes,
        "status": "completed"
    }))
}

async fn annul_sale(path: web::Path<String>) -> impl Responder {
    let sale_id = path.into_inner();
    
    // En una implementación real, actualizaríamos el estado en la base de datos
    // y revertiríamos los cambios en el inventario
    
    HttpResponse::Ok().json(json!({
        "id": sale_id,
        "status": "annulled",
        "annulled_at": Utc::now().to_rfc3339(),
        "success": true
    }))
}