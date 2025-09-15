// src-backend-rust/src/routes/brands.rs

use actix_web::{web, HttpResponse, Responder, http::StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{debug, error};
use crate::database_manager::DbPool;
use crate::models::brand::{Brand, NewBrand, UpdateBrand};

// Configuración de rutas para marcas
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/brands")
            .route("", web::get().to(get_brands))
            .route("/{id}", web::get().to(get_brand))
            .route("", web::post().to(create_brand))
            .route("/{id}", web::put().to(update_brand))
            .route("/{id}", web::delete().to(delete_brand))
            .route("/search/{name}", web::get().to(search_brands))
            .route("/subdepartment/{id}", web::get().to(get_brands_by_subdepartment))
    );
}

// Controladores

async fn get_brands(pool: web::Data<DbPool>) -> impl Responder {
    let conn_result = pool.get();
    if let Err(e) = conn_result {
        error!("Error al obtener conexión del pool: {}", e);
        return HttpResponse::InternalServerError().json(json!({
            "error": "Error de conexión a la base de datos"
        }));
    }
    
    match Brand::find_all(&pool) {
        Ok(brands) => {
            HttpResponse::Ok().json(brands)
        },
        Err(e) => {
            error!("Error al obtener marcas: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener marcas",
                "details": e.to_string()
            }))
        }
    }
}

async fn get_brand(path: web::Path<i64>, pool: web::Data<DbPool>) -> impl Responder {
    let brand_id = path.into_inner();
    
    match Brand::find_by_id(&pool, brand_id) {
        Ok(brand_opt) => {
            match brand_opt {
                Some(brand) => HttpResponse::Ok().json(brand),
                None => HttpResponse::NotFound().json(json!({
                    "error": "Marca no encontrada"
                }))
            }
        },
        Err(e) => {
            error!("Error al obtener marca: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener marca",
                "details": e.to_string()
            }))
        }
    }
}

async fn create_brand(brand: web::Json<NewBrand>, pool: web::Data<DbPool>) -> impl Responder {
    match Brand::create(&pool, brand.into_inner()) {
        Ok(created_brand) => {
            HttpResponse::Created().json(created_brand)
        },
        Err(e) => {
            // Verificar si es un error de restricción (nombre duplicado)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("Ya existe una marca con ese nombre") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe una marca con ese nombre"
                    }));
                } else if msg.contains("El subdepartamento especificado no existe") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "El subdepartamento especificado no existe"
                    }));
                }
            }
            
            error!("Error al crear marca: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al crear marca",
                "details": e.to_string()
            }))
        }
    }
}

async fn update_brand(path: web::Path<i64>, brand: web::Json<UpdateBrand>, pool: web::Data<DbPool>) -> impl Responder {
    let brand_id = path.into_inner();
    
    match Brand::update(&pool, brand_id, brand.into_inner()) {
        Ok(updated_brand) => {
            HttpResponse::Ok().json(updated_brand)
        },
        Err(e) => {
            // Verificar si es un error de marca no encontrada
            if let rusqlite::Error::QueryReturnedNoRows = e {
                return HttpResponse::NotFound().json(json!({
                    "error": "Marca no encontrada"
                }));
            }
            
            // Verificar si es un error de restricción (nombre duplicado)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("Ya existe una marca con ese nombre") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe una marca con ese nombre"
                    }));
                } else if msg.contains("El subdepartamento especificado no existe") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "El subdepartamento especificado no existe"
                    }));
                }
            }
            
            error!("Error al actualizar marca: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al actualizar marca",
                "details": e.to_string()
            }))
        }
    }
}

async fn delete_brand(path: web::Path<i64>, pool: web::Data<DbPool>) -> impl Responder {
    let brand_id = path.into_inner();
    
    // En un caso real, necesitaríamos obtener el ID del usuario que realiza la acción
    // Aquí usamos "system" como ejemplo
    match Brand::delete(&pool, brand_id, Some("system".to_string())) {
        Ok(_) => {
            HttpResponse::Ok().json(json!({
                "id": brand_id,
                "deleted": true
            }))
        },
        Err(e) => {
            // Verificar si es un error de marca no encontrada
            if let rusqlite::Error::QueryReturnedNoRows = e {
                return HttpResponse::NotFound().json(json!({
                    "error": "Marca no encontrada"
                }));
            }
            
            // Verificar si es un error de restricción (productos asociados)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("No se puede eliminar la marca porque tiene productos asociados") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "No se puede eliminar la marca porque tiene productos asociados"
                    }));
                }
            }
            
            error!("Error al eliminar marca: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al eliminar marca",
                "details": e.to_string()
            }))
        }
    }
}

async fn search_brands(path: web::Path<String>, pool: web::Data<DbPool>) -> impl Responder {
    let name = path.into_inner();
    
    match Brand::search_by_name(&pool, &name) {
        Ok(brands) => {
            HttpResponse::Ok().json(brands)
        },
        Err(e) => {
            error!("Error al buscar marcas: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al buscar marcas",
                "details": e.to_string()
            }))
        }
    }
}

async fn get_brands_by_subdepartment(path: web::Path<i64>, pool: web::Data<DbPool>) -> impl Responder {
    let subdepartment_id = path.into_inner();
    
    match Brand::find_by_subdepartment(&pool, subdepartment_id) {
        Ok(brands) => {
            HttpResponse::Ok().json(brands)
        },
        Err(e) => {
            error!("Error al obtener marcas por subdepartamento: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener marcas por subdepartamento",
                "details": e.to_string()
            }))
        }
    }
}