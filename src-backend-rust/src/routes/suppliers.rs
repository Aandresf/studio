// src-backend-rust/src/routes/suppliers.rs

use actix_web::{web, HttpResponse, Responder, http::StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{debug, error};
use crate::database_manager::DbPool;
use crate::models::customer_supplier::{Supplier, NewSupplier, UpdateSupplier};

// Configuración de rutas para proveedores
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/suppliers")
            .route("", web::get().to(get_suppliers))
            .route("/{id}", web::get().to(get_supplier))
            .route("", web::post().to(create_supplier))
            .route("/{id}", web::put().to(update_supplier))
            .route("/{id}", web::delete().to(delete_supplier))
            .route("/search/{name}", web::get().to(search_suppliers))
    );
}

// Controladores

async fn get_suppliers(web::Query(params): web::Query<serde_json::Value>, pool: web::Data<DbPool>) -> impl Responder {
    // Extraer parámetros de paginación
    let limit = params["limit"].as_i64();
    let offset = params["offset"].as_i64();
    
    match Supplier::find_all(&pool, limit, offset) {
        Ok(suppliers) => {
            HttpResponse::Ok().json(suppliers)
        },
        Err(e) => {
            error!("Error al obtener proveedores: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener proveedores",
                "details": e.to_string()
            }))
        }
    }
}

async fn get_supplier(path: web::Path<i64>, pool: web::Data<DbPool>) -> impl Responder {
    let supplier_id = path.into_inner();
    
    match Supplier::find_by_id(&pool, supplier_id) {
        Ok(supplier_opt) => {
            match supplier_opt {
                Some(supplier) => HttpResponse::Ok().json(supplier),
                None => HttpResponse::NotFound().json(json!({
                    "error": "Proveedor no encontrado"
                }))
            }
        },
        Err(e) => {
            error!("Error al obtener proveedor: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener proveedor",
                "details": e.to_string()
            }))
        }
    }
}

async fn create_supplier(supplier: web::Json<NewSupplier>, pool: web::Data<DbPool>) -> impl Responder {
    match Supplier::create(&pool, supplier.into_inner()) {
        Ok(created_supplier) => {
            HttpResponse::Created().json(created_supplier)
        },
        Err(e) => {
            // Verificar si es un error de restricción
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("UNIQUE constraint failed") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe un proveedor con ese RFC"
                    }));
                }
            }
            
            error!("Error al crear proveedor: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al crear proveedor",
                "details": e.to_string()
            }))
        }
    }
}

async fn update_supplier(path: web::Path<i64>, supplier: web::Json<UpdateSupplier>, pool: web::Data<DbPool>) -> impl Responder {
    let supplier_id = path.into_inner();
    
    match Supplier::update(&pool, supplier_id, supplier.into_inner()) {
        Ok(updated_supplier) => {
            HttpResponse::Ok().json(updated_supplier)
        },
        Err(e) => {
            // Verificar si es un error de proveedor no encontrado
            if let rusqlite::Error::QueryReturnedNoRows = e {
                return HttpResponse::NotFound().json(json!({
                    "error": "Proveedor no encontrado"
                }));
            }
            
            // Verificar si es un error de restricción
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("UNIQUE constraint failed") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe un proveedor con ese RFC"
                    }));
                }
            }
            
            error!("Error al actualizar proveedor: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al actualizar proveedor",
                "details": e.to_string()
            }))
        }
    }
}

async fn delete_supplier(path: web::Path<i64>, pool: web::Data<DbPool>) -> impl Responder {
    let supplier_id = path.into_inner();
    
    // En un caso real, necesitaríamos obtener el ID del usuario que realiza la acción
    match Supplier::delete(&pool, supplier_id, Some("system".to_string())) {
        Ok(_) => {
            HttpResponse::Ok().json(json!({
                "id": supplier_id,
                "deleted": true
            }))
        },
        Err(e) => {
            // Verificar si es un error de proveedor no encontrado
            if let rusqlite::Error::QueryReturnedNoRows = e {
                return HttpResponse::NotFound().json(json!({
                    "error": "Proveedor no encontrado"
                }));
            }
            
            // Verificar si es un error de restricción (compras asociadas)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("No se puede eliminar el proveedor porque tiene compras asociadas") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "No se puede eliminar el proveedor porque tiene compras asociadas"
                    }));
                }
            }
            
            error!("Error al eliminar proveedor: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al eliminar proveedor",
                "details": e.to_string()
            }))
        }
    }
}

async fn search_suppliers(path: web::Path<String>, pool: web::Data<DbPool>) -> impl Responder {
    let name = path.into_inner();
    
    match Supplier::search_by_name(&pool, &name) {
        Ok(suppliers) => {
            HttpResponse::Ok().json(suppliers)
        },
        Err(e) => {
            error!("Error al buscar proveedores: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al buscar proveedores",
                "details": e.to_string()
            }))
        }
    }
}