// src-backend-rust/src/routes/inventory.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use crate::lib::authorize::Authorize;
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryAdjustment {
    product_id: String,
    quantity: f64,
    reason: String,
    reference: Option<String>,
}

// Configuración de rutas para inventario
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/inventory")
            .route("/movements", web::get().to(get_movements))
            .route("/adjust", web::post().to(adjust_inventory))
            .route("/export", web::get().to(export_inventory))
    );
}

// Controladores

async fn get_movements() -> impl Responder {
    // En una implementación real, consultaríamos la base de datos
    HttpResponse::Ok().json(json!([
        {
            "id": "1",
            "product_id": "prod1",
            "product_name": "Producto 1",
            "quantity": 10.0,
            "type": "purchase",
            "date": "2023-09-15T10:00:00Z",
            "reference": "COMPRA-001"
        },
        {
            "id": "2",
            "product_id": "prod1",
            "product_name": "Producto 1",
            "quantity": -2.0,
            "type": "sale",
            "date": "2023-09-15T14:30:00Z",
            "reference": "VENTA-001"
        }
    ]))
}

async fn adjust_inventory(adjustment: web::Json<InventoryAdjustment>) -> impl Responder {
    // En una implementación real, actualizaríamos el stock en la base de datos
    // y registraríamos el movimiento
    
    HttpResponse::Ok().json(json!({
        "success": true,
        "product_id": adjustment.product_id,
        "adjusted_quantity": adjustment.quantity,
        "reason": adjustment.reason,
        "reference": adjustment.reference,
        "date": "2023-09-15T15:45:00Z"
    }))
}

async fn export_inventory() -> impl Responder {
    // En una implementación real, generaríamos un archivo Excel con el excel_generator
    // y lo devolveríamos como respuesta de descarga
    
    // Por ahora, solo devolvemos un mensaje de éxito
    HttpResponse::Ok().json(json!({
        "success": true,
        "message": "La funcionalidad de exportación aún no está implementada en esta versión de Rust"
    }))
}