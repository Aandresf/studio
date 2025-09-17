// src-backend-rust/src/routes/search.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{error, debug};
use crate::database_manager::DbPool;
use crate::models::search::Search;
use crate::lib::authorize::{Authorize, permissions};
use crate::models::role_permission::{Permission};

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchQuery {
    q: String,
    limit: Option<usize>,
    entity_type: Option<String>, // "products", "sales", "purchases", "customers", "suppliers", "users"
}

// Configuración de rutas para búsqueda
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/search")
            .route("", web::get().to(global_search))
            .route("/products", web::get().to(search_products))
            .route("/sales", web::get().to(search_sales))
            .route("/purchases", web::get().to(search_purchases))
            .route("/customers", web::get().to(search_customers))
            .route("/suppliers", web::get().to(search_suppliers))
            .route("/users", web::get().to(search_users))
    );
}

// Controladores
async fn global_search(
    db_pool: web::Data<DbPool>,
    query: web::Query<SearchQuery>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos - solo requiere autenticación general
    // La búsqueda se filtrará según los permisos del usuario
    
    let pool = db_pool.get_ref();
    let search_term = &query.q;
    let limit = query.limit;
    
    match Search::global_search(pool, search_term, limit) {
        Ok(results) => {
            // Filtramos los resultados según los permisos del usuario
            let mut filtered_results = results.clone();
            
            // Si el usuario no tiene permiso para ver productos, quitamos esos resultados
            if !authorize.has_permission(&permissions::PRODUCTS_VIEW) && filtered_results.contains_key("products") {
                filtered_results.remove("products");
            }
            
            // Si el usuario no tiene permiso para ver ventas, quitamos esos resultados
            if !authorize.has_permission(&permissions::SALES_VIEW) && filtered_results.contains_key("sales") {
                filtered_results.remove("sales");
            }
            
            // Si el usuario no tiene permiso para ver compras, quitamos esos resultados
            if !authorize.has_permission(&permissions::PURCHASES_VIEW) && filtered_results.contains_key("purchases") {
                filtered_results.remove("purchases");
            }
            
            // Si el usuario no tiene permiso para ver clientes, quitamos esos resultados
            if !authorize.has_permission(&permissions::CUSTOMERS_VIEW) && filtered_results.contains_key("customers") {
                filtered_results.remove("customers");
            }
            
            // Si el usuario no tiene permiso para ver proveedores, quitamos esos resultados
            if !authorize.has_permission(&permissions::SUPPLIERS_VIEW) && filtered_results.contains_key("suppliers") {
                filtered_results.remove("suppliers");
            }
            
            // Si el usuario no tiene permiso para ver usuarios, quitamos esos resultados
            if !authorize.has_permission(&permissions::USERS_VIEW) && filtered_results.contains_key("users") {
                filtered_results.remove("users");
            }
            
            // Calcular el total de resultados
            let total: usize = filtered_results.values().map(|v| v.len()).sum();
            
            HttpResponse::Ok().json(json!({
                "query": search_term,
                "results": filtered_results,
                "total": total,
                "limit": limit
            }))
        },
        Err(e) => {
            error!("Error en la búsqueda global: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al realizar la búsqueda"
            }))
        }
    }
}

async fn search_products(
    db_pool: web::Data<DbPool>,
    query: web::Query<SearchQuery>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::PRODUCTS_VIEW) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para buscar productos"
        }));
    }
    
    let pool = db_pool.get_ref();
    let search_term = &query.q;
    let limit = query.limit;
    
    match Search::search_products(pool, search_term, limit) {
        Ok(results) => {
            let total = results.len();
            
            HttpResponse::Ok().json(json!({
                "query": search_term,
                "results": results,
                "total": total,
                "limit": limit
            }))
        },
        Err(e) => {
            error!("Error en la búsqueda de productos: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al buscar productos"
            }))
        }
    }
}

async fn search_sales(
    db_pool: web::Data<DbPool>,
    query: web::Query<SearchQuery>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::SALES_VIEW) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para buscar ventas"
        }));
    }
    
    let pool = db_pool.get_ref();
    let search_term = &query.q;
    let limit = query.limit;
    
    match Search::search_sales(pool, search_term, limit) {
        Ok(results) => {
            let total = results.len();
            
            HttpResponse::Ok().json(json!({
                "query": search_term,
                "results": results,
                "total": total,
                "limit": limit
            }))
        },
        Err(e) => {
            error!("Error en la búsqueda de ventas: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al buscar ventas"
            }))
        }
    }
}

async fn search_purchases(
    db_pool: web::Data<DbPool>,
    query: web::Query<SearchQuery>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::PURCHASES_VIEW) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para buscar compras"
        }));
    }
    
    let pool = db_pool.get_ref();
    let search_term = &query.q;
    let limit = query.limit;
    
    match Search::search_purchases(pool, search_term, limit) {
        Ok(results) => {
            let total = results.len();
            
            HttpResponse::Ok().json(json!({
                "query": search_term,
                "results": results,
                "total": total,
                "limit": limit
            }))
        },
        Err(e) => {
            error!("Error en la búsqueda de compras: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al buscar compras"
            }))
        }
    }
}

async fn search_customers(
    db_pool: web::Data<DbPool>,
    query: web::Query<SearchQuery>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::CUSTOMERS_VIEW) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para buscar clientes"
        }));
    }
    
    let pool = db_pool.get_ref();
    let search_term = &query.q;
    let limit = query.limit;
    
    match Search::search_customers(pool, search_term, limit) {
        Ok(results) => {
            let total = results.len();
            
            HttpResponse::Ok().json(json!({
                "query": search_term,
                "results": results,
                "total": total,
                "limit": limit
            }))
        },
        Err(e) => {
            error!("Error en la búsqueda de clientes: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al buscar clientes"
            }))
        }
    }
}

async fn search_suppliers(
    db_pool: web::Data<DbPool>,
    query: web::Query<SearchQuery>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::SUPPLIERS_VIEW) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para buscar proveedores"
        }));
    }
    
    let pool = db_pool.get_ref();
    let search_term = &query.q;
    let limit = query.limit;
    
    match Search::search_suppliers(pool, search_term, limit) {
        Ok(results) => {
            let total = results.len();
            
            HttpResponse::Ok().json(json!({
                "query": search_term,
                "results": results,
                "total": total,
                "limit": limit
            }))
        },
        Err(e) => {
            error!("Error en la búsqueda de proveedores: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al buscar proveedores"
            }))
        }
    }
}

async fn search_users(
    db_pool: web::Data<DbPool>,
    query: web::Query<SearchQuery>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::USERS_VIEW) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para buscar usuarios"
        }));
    }
    
    let pool = db_pool.get_ref();
    let search_term = &query.q;
    let limit = query.limit;
    
    match Search::search_users(pool, search_term, limit) {
        Ok(results) => {
            let total = results.len();
            
            HttpResponse::Ok().json(json!({
                "query": search_term,
                "results": results,
                "total": total,
                "limit": limit
            }))
        },
        Err(e) => {
            error!("Error en la búsqueda de usuarios: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al buscar usuarios"
            }))
        }
    }
}

