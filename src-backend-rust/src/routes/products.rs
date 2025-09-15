// src-backend-rust// Configuración de rutas para productos
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/products")
            .route("", web::get().to(get_products))
            .route("/{id}", web::get().to(get_product))
            .route("", web::post().to(create_product))
            .route("/{id}", web::put().to(update_product))
            .route("/{id}", web::delete().to(delete_product))
            .route("/count", web::get().to(count_products))
            .route("/by-brand/{brand_id}", web::get().to(get_products_by_brand))
            .route("/by-subdepartment/{subdepartment_id}", web::get().to(get_products_by_subdepartment))
    );
}

use actix_web::{web, HttpResponse, Responder, http::StatusCode};
use serde::{Deserialize, Serialize};
use crate::lib::authorize::Authorize;
use crate::database_manager::DbPool;
use crate::models::product::{Product, NewProduct, UpdateProduct, ProductDetail};
use log::{error, debug};
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub brand_id: Option<i64>,
    pub subdepartment_id: Option<i64>,
    pub search: Option<String>,
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

async fn get_products(
    query: web::Query<ProductQuery>,
    pool: web::Data<DbPool>
) -> impl Responder {
    match Product::find_all(&pool, query.limit, query.offset) {
        Ok(products) => HttpResponse::Ok().json(products),
        Err(e) => {
            error!("Error al obtener productos: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener productos",
                "details": e.to_string()
            }))
        }
    }
}

async fn get_product(
    path: web::Path<i64>,
    pool: web::Data<DbPool>
) -> impl Responder {
    let product_id = path.into_inner();
    
    match Product::find_by_id(&pool, product_id) {
        Ok(Some(product)) => HttpResponse::Ok().json(product),
        Ok(None) => HttpResponse::NotFound().json(json!({
            "error": "Producto no encontrado"
        })),
        Err(e) => {
            error!("Error al obtener producto con ID {}: {}", product_id, e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener el producto",
                "details": e.to_string()
            }))
        }
    }
}


async fn create_product(
    product: web::Json<NewProduct>, 
    pool: web::Data<DbPool>
) -> impl Responder {
    match Product::create(&pool, product.into_inner()) {
        Ok(product) => HttpResponse::Created().json(product),
        Err(e) => {
            error!("Error al crear producto: {}", e);
            let status_code = if e.to_string().contains("Ya existe un producto con ese código") {
                StatusCode::CONFLICT
            } else {
                StatusCode::INTERNAL_SERVER_ERROR
            };
            
            HttpResponse::build(status_code).json(json!({
                "error": "Error al crear el producto",
                "details": e.to_string()
            }))
        }
    }
}

async fn update_product(
    path: web::Path<i64>, 
    product: web::Json<UpdateProduct>, 
    pool: web::Data<DbPool>
) -> impl Responder {
    let product_id = path.into_inner();
    
    match Product::update(&pool, product_id, product.into_inner()) {
        Ok(product) => HttpResponse::Ok().json(product),
        Err(e) => {
            error!("Error al actualizar producto con ID {}: {}", product_id, e);
            let status_code = if e == rusqlite::Error::QueryReturnedNoRows {
                StatusCode::NOT_FOUND
            } else if e.to_string().contains("Ya existe un producto con ese código") {
                StatusCode::CONFLICT
            } else {
                StatusCode::INTERNAL_SERVER_ERROR
            };
            
            HttpResponse::build(status_code).json(json!({
                "error": "Error al actualizar el producto",
                "details": e.to_string()
            }))
        }
    }
}


async fn delete_product(
    path: web::Path<i64>, 
    pool: web::Data<DbPool>
) -> impl Responder {
    let product_id = path.into_inner();
    
    match Product::delete(&pool, product_id) {
        Ok(_) => HttpResponse::Ok().json(json!({
            "id": product_id,
            "deleted": true
        })),
        Err(e) => {
            error!("Error al eliminar producto con ID {}: {}", product_id, e);
            let status_code = if e == rusqlite::Error::QueryReturnedNoRows {
                StatusCode::NOT_FOUND
            } else {
                StatusCode::INTERNAL_SERVER_ERROR
            };
            
            HttpResponse::build(status_code).json(json!({
                "error": "Error al eliminar el producto",
                "details": e.to_string()
            }))
        }
    }
}

async fn count_products(pool: web::Data<DbPool>) -> impl Responder {
    match Product::count_all(&pool) {
        Ok(count) => HttpResponse::Ok().json(json!({
            "count": count
        })),
        Err(e) => {
            error!("Error al contar productos: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al contar productos",
                "details": e.to_string()
            }))
        }
    }
}

async fn get_products_by_brand(
    path: web::Path<i64>,
    pool: web::Data<DbPool>
) -> impl Responder {
    let brand_id = path.into_inner();
    
    match Product::find_by_brand(&pool, brand_id) {
        Ok(products) => HttpResponse::Ok().json(products),
        Err(e) => {
            error!("Error al obtener productos por marca: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener productos por marca",
                "details": e.to_string()
            }))
        }
    }
}

async fn get_products_by_subdepartment(
    path: web::Path<i64>,
    pool: web::Data<DbPool>
) -> impl Responder {
    let subdepartment_id = path.into_inner();
    
    match Product::find_by_subdepartment(&pool, subdepartment_id) {
        Ok(products) => HttpResponse::Ok().json(products),
        Err(e) => {
            error!("Error al obtener productos por subdepartamento: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener productos por subdepartamento",
                "details": e.to_string()
            }))
        }
    }
}