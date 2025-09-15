// src-backend-rust/src/routes/inventory.rs

use actix_web::{web, HttpResponse, Responder, http::header};
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{error, debug};
use crate::database_manager::DbPool;
use crate::models::inventory_movement::{InventoryMovement, NewInventoryMovement, InventoryMovementDetail};
use crate::lib::authorize::{Authorize, Permission};

// Estructuras para solicitudes de ajuste de inventario
#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryAdjustment {
    product_variant_id: i64,
    quantity: i64,
    movement_type: String,
    reference: Option<String>,
    notes: Option<String>,
    user_id: i64,
}

// Estructuras para parámetros de consulta
#[derive(Debug, Deserialize)]
pub struct MovementsQueryParams {
    limit: Option<i64>,
    offset: Option<i64>,
    product_id: Option<i64>,
    movement_type: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ExportQueryParams {
    product_id: Option<i64>,
    movement_type: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
}

// Configuración de rutas para inventario
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/inventory")
            .route("/movements", web::get().to(get_movements))
            .route("/movements/{id}", web::get().to(get_movement_by_id))
            .route("/movements", web::post().to(create_movement))
            .route("/movements/by-product/{product_id}", web::get().to(get_movements_by_product))
            .route("/movements/by-variant/{variant_id}", web::get().to(get_movements_by_variant))
            .route("/movements/summary", web::get().to(get_movements_summary))
            .route("/export", web::get().to(export_inventory))
    );
}

// Controladores
async fn get_movements(
    db_pool: web::Data<DbPool>,
    query: web::Query<MovementsQueryParams>,
    _: Authorize,
) -> impl Responder {
    let pool = db_pool.get_ref();
    
    // Obtener parámetros de consulta
    let limit = query.limit;
    let offset = query.offset;
    let product_id = query.product_id;
    let movement_type = query.movement_type.clone();
    let start_date = query.start_date.clone();
    let end_date = query.end_date.clone();
    
    // Obtener movimientos detallados con paginación y filtros
    match InventoryMovement::find_with_details_paginated(
        pool, limit, offset, product_id, movement_type, start_date, end_date
    ) {
        Ok(movements) => {
            // Obtener el total para la paginación
            let total = match InventoryMovement::count_with_filters(
                pool, product_id, query.movement_type.clone(), query.start_date.clone(), query.end_date.clone()
            ) {
                Ok(count) => count,
                Err(e) => {
                    error!("Error al contar movimientos de inventario: {}", e);
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Error al contar movimientos de inventario"
                    }));
                }
            };
            
            HttpResponse::Ok().json(json!({
                "data": movements,
                "total": total
            }))
        },
        Err(e) => {
            error!("Error al obtener movimientos de inventario: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener movimientos de inventario"
            }))
        }
    }
}

async fn get_movement_by_id(
    db_pool: web::Data<DbPool>,
    id: web::Path<i64>,
    _: Authorize,
) -> impl Responder {
    let pool = db_pool.get_ref();
    let movement_id = id.into_inner();
    
    match InventoryMovement::find_with_details(pool, movement_id) {
        Ok(Some(movement)) => HttpResponse::Ok().json(movement),
        Ok(None) => HttpResponse::NotFound().json(json!({
            "error": "Movimiento de inventario no encontrado"
        })),
        Err(e) => {
            error!("Error al obtener movimiento de inventario: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener movimiento de inventario"
            }))
        }
    }
}

async fn create_movement(
    db_pool: web::Data<DbPool>,
    movement: web::Json<InventoryAdjustment>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos específicos para crear movimientos de inventario
    if !authorize.has_permission(&Permission::InventoryManage) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para gestionar el inventario"
        }));
    }
    
    let pool = db_pool.get_ref();
    
    // Convertir a la estructura esperada por el modelo
    let new_movement = NewInventoryMovement {
        product_variant_id: movement.product_variant_id,
        quantity: movement.quantity,
        movement_type: movement.movement_type.clone(),
        reference: movement.reference.clone(),
        notes: movement.notes.clone(),
        user_id: movement.user_id,
    };
    
    match InventoryMovement::create(pool, new_movement) {
        Ok(created_movement) => {
            debug!("Movimiento de inventario creado con éxito: {:?}", created_movement);
            
            // Obtener detalles completos del movimiento creado
            match InventoryMovement::find_with_details(pool, created_movement.id) {
                Ok(Some(movement_detail)) => HttpResponse::Created().json(movement_detail),
                Ok(None) => HttpResponse::Created().json(created_movement),
                Err(e) => {
                    error!("Error al obtener detalles del movimiento creado: {}", e);
                    HttpResponse::Created().json(created_movement)
                }
            }
        },
        Err(e) => {
            error!("Error al crear movimiento de inventario: {}", e);
            
            // Manejar diferentes tipos de errores
            if let rusqlite::Error::SqliteFailure(sqlite_error, Some(error_msg)) = &e {
                if sqlite_error.code == rusqlite::ffi::ErrorCode::ConstraintViolation {
                    return HttpResponse::BadRequest().json(json!({
                        "error": error_msg
                    }));
                }
            }
            
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al crear movimiento de inventario"
            }))
        }
    }
}

async fn get_movements_by_product(
    db_pool: web::Data<DbPool>,
    product_id: web::Path<i64>,
    _: Authorize,
) -> impl Responder {
    let pool = db_pool.get_ref();
    let product_id = product_id.into_inner();
    
    match InventoryMovement::find_by_product(pool, product_id) {
        Ok(movements) => HttpResponse::Ok().json(movements),
        Err(e) => {
            error!("Error al obtener movimientos por producto: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener movimientos por producto"
            }))
        }
    }
}

async fn get_movements_by_variant(
    db_pool: web::Data<DbPool>,
    variant_id: web::Path<i64>,
    _: Authorize,
) -> impl Responder {
    let pool = db_pool.get_ref();
    let variant_id = variant_id.into_inner();
    
    match InventoryMovement::find_by_product_variant(pool, variant_id) {
        Ok(movements) => HttpResponse::Ok().json(movements),
        Err(e) => {
            error!("Error al obtener movimientos por variante: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener movimientos por variante de producto"
            }))
        }
    }
}

async fn get_movements_summary(
    db_pool: web::Data<DbPool>,
    query: web::Query<ExportQueryParams>,
    _: Authorize,
) -> impl Responder {
    let pool = db_pool.get_ref();
    
    match InventoryMovement::get_movement_summary(pool, query.start_date.clone(), query.end_date.clone()) {
        Ok(summary) => {
            // Transformar el resultado para la API
            let summary_data: Vec<serde_json::Value> = summary
                .iter()
                .map(|(movement_type, count, total_quantity)| {
                    json!({
                        "movement_type": movement_type,
                        "count": count,
                        "total_quantity": total_quantity
                    })
                })
                .collect();
            
            HttpResponse::Ok().json(summary_data)
        },
        Err(e) => {
            error!("Error al obtener resumen de movimientos: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener resumen de movimientos"
            }))
        }
    }
}

async fn export_inventory(
    db_pool: web::Data<DbPool>,
    query: web::Query<ExportQueryParams>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos para exportar
    if !authorize.has_permission(&Permission::ReportsGenerate) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para generar reportes"
        }));
    }
    
    let pool = db_pool.get_ref();
    
    match InventoryMovement::export_to_csv(
        pool, 
        query.product_id, 
        query.movement_type.clone(), 
        query.start_date.clone(), 
        query.end_date.clone()
    ) {
        Ok(csv_content) => {
            // Generar nombre de archivo basado en la fecha actual
            let filename = format!("inventory_movements_{}.csv", chrono::Local::now().format("%Y%m%d_%H%M%S"));
            
            // Devolver el contenido CSV como un archivo para descargar
            HttpResponse::Ok()
                .append_header((header::CONTENT_TYPE, "text/csv; charset=utf-8"))
                .append_header((header::CONTENT_DISPOSITION, format!("attachment; filename=\"{}\"", filename)))
                .body(csv_content)
        },
        Err(e) => {
            error!("Error al exportar movimientos de inventario: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al exportar movimientos de inventario"
            }))
        }
    }
}