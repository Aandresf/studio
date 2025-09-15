// src-backend-rust/src/routes/purchases.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use crate::lib::authorize::Authorize;
use nanoid::nanoid;
use serde_json::json;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize)]
pub struct PurchaseItem {
    product_id: String,
    quantity: f64,
    cost: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Purchase {
    id: Option<String>,
    supplier_id: Option<String>,
    invoice_number: Option<String>,
    items: Vec<PurchaseItem>,
    total: f64,
    payment_method: String,
    notes: Option<String>,
}

// Configuración de rutas para compras
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/purchases")
            .route("", web::get().to(get_purchases))
            .route("/{id}", web::get().to(get_purchase))
            .route("", web::post().to(create_purchase))
            .route("/{id}/annul", web::post().to(annul_purchase))
    );
}

// Controladores

async fn get_purchases() -> impl Responder {
    // En una implementación real, consultaríamos la base de datos
    HttpResponse::Ok().json(json!([
        {
            "id": "C001",
            "date": "2023-09-10T09:15:00Z",
            "supplier_id": "S001",
            "supplier_name": "Proveedor Ejemplo",
            "invoice_number": "FAC-12345",
            "total": 5000.0,
            "status": "completed"
        },
        {
            "id": "C002",
            "date": "2023-09-12T11:30:00Z",
            "supplier_id": "S002",
            "supplier_name": "Otro Proveedor",
            "invoice_number": "FAC-54321",
            "total": 3200.0,
            "status": "completed"
        }
    ]))
}

async fn get_purchase(path: web::Path<String>) -> impl Responder {
    let purchase_id = path.into_inner();
    
    // En una implementación real, consultaríamos la base de datos por ID
    HttpResponse::Ok().json(json!({
        "id": purchase_id,
        "date": "2023-09-10T09:15:00Z",
        "supplier_id": "S001",
        "supplier_name": "Proveedor Ejemplo",
        "invoice_number": "FAC-12345",
        "items": [
            {
                "product_id": "P001",
                "product_name": "Producto 1",
                "quantity": 10.0,
                "cost": 300.0,
                "subtotal": 3000.0
            },
            {
                "product_id": "P002",
                "product_name": "Producto 2",
                "quantity": 5.0,
                "cost": 400.0,
                "subtotal": 2000.0
            }
        ],
        "total": 5000.0,
        "payment_method": "transferencia",
        "notes": "Pedido mensual",
        "status": "completed"
    }))
}

async fn create_purchase(purchase: web::Json<Purchase>) -> impl Responder {
    // En una implementación real, insertaríamos en la base de datos
    // y actualizaríamos el inventario
    
    let purchase_id = format!("C{}", nanoid!(6));
    let now = Utc::now().to_rfc3339();
    
    HttpResponse::Created().json(json!({
        "id": purchase_id,
        "date": now,
        "supplier_id": purchase.supplier_id,
        "invoice_number": purchase.invoice_number,
        "items": purchase.items,
        "total": purchase.total,
        "payment_method": purchase.payment_method,
        "notes": purchase.notes,
        "status": "completed"
    }))
}

async fn annul_purchase(path: web::Path<String>) -> impl Responder {
    let purchase_id = path.into_inner();
    
    // En una implementación real, actualizaríamos el estado en la base de datos
    // y revertiríamos los cambios en el inventario
    
    HttpResponse::Ok().json(json!({
        "id": purchase_id,
        "status": "annulled",
        "annulled_at": Utc::now().to_rfc3339(),
        "success": true
    }))
}