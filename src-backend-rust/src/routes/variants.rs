// src-backend-rust/src/routes/variants.rs

use actix_web::{web, HttpResponse, Responder};
use serde_json::json;
use log::{error, debug};
use crate::database_manager::DbPool;
use crate::models::product::{ProductVariant, ProductVariantDetail};
use crate::lib::authorize::{Authorize, Permission};

// Configuración de rutas para variantes de productos
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/variants")
            .route("", web::get().to(get_variants))
            .route("/{id}", web::get().to(get_variant))
            .route("/{id}/movements", web::get().to(get_variant_movements))
    );
}

// Controladores
async fn get_variants(
    db_pool: web::Data<DbPool>,
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&Permission::ProductsRead) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para ver variantes de productos"
        }));
    }
    
    let pool = db_pool.get_ref();
    
    match ProductVariant::find_all(pool) {
        Ok(variants) => HttpResponse::Ok().json(variants),
        Err(e) => {
            error!("Error al obtener variantes: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener variantes",
                "details": e.to_string()
            }))
        }
    }
}

async fn get_variant(
    path: web::Path<i64>,
    db_pool: web::Data<DbPool>,
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&Permission::ProductsRead) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para ver variantes de productos"
        }));
    }
    
    let variant_id = path.into_inner();
    let pool = db_pool.get_ref();
    
    match ProductVariant::find_by_id(pool, variant_id) {
        Ok(Some(variant)) => HttpResponse::Ok().json(variant),
        Ok(None) => HttpResponse::NotFound().json(json!({
            "error": "Variante no encontrada"
        })),
        Err(e) => {
            error!("Error al obtener variante con ID {}: {}", variant_id, e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener la variante",
                "details": e.to_string()
            }))
        }
    }
}

async fn get_variant_movements(
    path: web::Path<i64>,
    db_pool: web::Data<DbPool>,
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&Permission::InventoryView) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para ver movimientos de inventario"
        }));
    }
    
    let variant_id = path.into_inner();
    let pool = db_pool.get_ref();
    
    match crate::models::inventory_movement::InventoryMovement::find_by_product_variant(pool, variant_id) {
        Ok(movements) => HttpResponse::Ok().json(movements),
        Err(e) => {
            error!("Error al obtener movimientos para la variante con ID {}: {}", variant_id, e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener los movimientos de inventario",
                "details": e.to_string()
            }))
        }
    }
}