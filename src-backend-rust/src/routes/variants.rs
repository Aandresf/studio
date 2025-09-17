// src-backend-rust/src/routes/variants.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{error, debug};
use std::sync::Arc;
use crate::database_manager::{DatabaseManager, DbPool};
use crate::models::product::{ProductVariant, ProductVariantDetail, NewProductVariant, UpdateProductVariant};
use crate::lib::authorize::{Authorize, permissions};
use crate::models::role_permission::{Permission};

// Configuración de rutas para variantes de productos
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/variants")
            .route("", web::get().to(get_variants))
            .route("", web::post().to(create_variant))
            .route("/{id}", web::get().to(get_variant))
            .route("/{id}", web::put().to(update_variant))
            .route("/{id}", web::delete().to(delete_variant))
            .route("/{id}/movements", web::get().to(get_variant_movements))
    );
}

#[derive(Deserialize)]
struct VariantsQuery {
    product_id: Option<i64>,
}

// Controladores
async fn get_variants(
    query: web::Query<VariantsQuery>,
    db_manager: web::Data<Arc<DatabaseManager>>,
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::PRODUCTS_READ) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para ver variantes de productos"
        }));
    }
    
    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };
    
    // Si se proporciona product_id, filtrar por producto, si no, obtener todas las variantes
    let result = if let Some(product_id) = query.product_id {
        debug!("Obteniendo variantes para producto ID: {}", product_id);
        ProductVariant::find_by_product(&pool, product_id)
    } else {
        debug!("Obteniendo todas las variantes");
        ProductVariant::find_all(&pool)
    };
    
    match result {
        Ok(variants) => {
            debug!("Se encontraron {} variantes", variants.len());
            HttpResponse::Ok().json(variants)
        },
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
    db_manager: web::Data<Arc<DatabaseManager>>,
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::PRODUCTS_READ) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para ver variantes de productos"
        }));
    }
    
    let variant_id = path.into_inner();
    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };
    
    match ProductVariant::find_by_id(&pool, variant_id) {
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
    db_manager: web::Data<Arc<DatabaseManager>>,
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::PRODUCTS_READ) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para ver movimientos de inventario"
        }));
    }
    
    let variant_id = path.into_inner();
    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };
    
    match vec![] as Vec<serde_json::Value> {
        movements => HttpResponse::Ok().json(movements),
    }
}

// Crear nueva variante
async fn create_variant(
    variant_data: web::Json<NewProductVariant>,
    db_manager: web::Data<Arc<DatabaseManager>>,
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::PRODUCTS_EDIT) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para crear variantes de productos"
        }));
    }

    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };

    match ProductVariant::create(&pool, variant_data.into_inner()) {
        Ok(variant) => HttpResponse::Created().json(variant),
        Err(e) => {
            error!("Error al crear variante: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al crear la variante",
                "details": e.to_string()
            }))
        }
    }
}

// Actualizar variante
async fn update_variant(
    path: web::Path<i64>,
    update_data: web::Json<UpdateProductVariant>,
    db_manager: web::Data<Arc<DatabaseManager>>,
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::PRODUCTS_EDIT) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para editar variantes de productos"
        }));
    }

    let variant_id = path.into_inner();
    
    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };

    match ProductVariant::update(&pool, variant_id, update_data.into_inner()) {
        Ok(variant) => HttpResponse::Ok().json(variant),
        Err(e) => {
            error!("Error al actualizar variante con ID {}: {}", variant_id, e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al actualizar la variante",
                "details": e.to_string()
            }))
        }
    }
}

// Eliminar variante
async fn delete_variant(
    path: web::Path<i64>,
    db_manager: web::Data<Arc<DatabaseManager>>,
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::PRODUCTS_DELETE) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para eliminar variantes de productos"
        }));
    }

    let variant_id = path.into_inner();
    
    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };

    match ProductVariant::delete(&pool, variant_id, Some("admin".to_string())) {
        Ok(_) => HttpResponse::Ok().json(json!({
            "message": "Variante eliminada exitosamente"
        })),
        Err(e) => {
            error!("Error al eliminar variante con ID {}: {}", variant_id, e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al eliminar la variante",
                "details": e.to_string()
            }))
        }
    }
}
