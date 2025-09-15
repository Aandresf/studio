// src-backend-rust/src/routes/search.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{error, debug};
use crate::database_manager::DbPool;
use crate::models::search::Search;
use crate::lib::authorize::{Authorize, Permission};

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
            if !authorize.has_permission(&Permission::ProductsView) && filtered_results.contains_key("products") {
                filtered_results.remove("products");
            }
            
            // Si el usuario no tiene permiso para ver ventas, quitamos esos resultados
            if !authorize.has_permission(&Permission::SalesView) && filtered_results.contains_key("sales") {
                filtered_results.remove("sales");
            }
            
            // Si el usuario no tiene permiso para ver compras, quitamos esos resultados
            if !authorize.has_permission(&Permission::PurchasesView) && filtered_results.contains_key("purchases") {
                filtered_results.remove("purchases");
            }
            
            // Si el usuario no tiene permiso para ver clientes, quitamos esos resultados
            if !authorize.has_permission(&Permission::CustomersView) && filtered_results.contains_key("customers") {
                filtered_results.remove("customers");
            }
            
            // Si el usuario no tiene permiso para ver proveedores, quitamos esos resultados
            if !authorize.has_permission(&Permission::SuppliersView) && filtered_results.contains_key("suppliers") {
                filtered_results.remove("suppliers");
            }
            
            // Si el usuario no tiene permiso para ver usuarios, quitamos esos resultados
            if !authorize.has_permission(&Permission::UsersView) && filtered_results.contains_key("users") {
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
    if !authorize.has_permission(&Permission::ProductsView) {
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
    if !authorize.has_permission(&Permission::SalesView) {
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
    if !authorize.has_permission(&Permission::PurchasesView) {
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
    if !authorize.has_permission(&Permission::CustomersView) {
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
    if !authorize.has_permission(&Permission::SuppliersView) {
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
    if !authorize.has_permission(&Permission::UsersView) {
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

async fn search_products(query: web::Query<SearchQuery>) -> impl Responder {
    // En una implementación real, buscaríamos productos en la base de datos
    let search_term = &query.q;
    let limit = query.limit.unwrap_or(10);
    
    HttpResponse::Ok().json(json!({
        "query": search_term,
        "results": [
            {
                "id": "P001",
                "name": "Producto 1",
                "code": "PRD001",
                "price": 100.0,
                "stock": 50.0,
                "category": "Categoría 1"
            },
            {
                "id": "P002",
                "name": "Producto 2",
                "code": "PRD002",
                "price": 150.0,
                "stock": 30.0,
                "category": "Categoría 2"
            },
            {
                "id": "P003",
                "name": "Producto 3",
                "code": "PRD003",
                "price": 200.0,
                "stock": 25.0,
                "category": "Categoría 1"
            }
        ],
        "total": 3,
        "limit": limit
    }))
}

async fn search_sales(query: web::Query<SearchQuery>) -> impl Responder {
    // En una implementación real, buscaríamos ventas en la base de datos
    let search_term = &query.q;
    let limit = query.limit.unwrap_or(10);
    
    HttpResponse::Ok().json(json!({
        "query": search_term,
        "results": [
            {
                "id": "S001",
                "invoice_number": "INV001",
                "customer": "Cliente 1",
                "date": "2023-10-15",
                "total": 1500.0,
                "status": "completed"
            },
            {
                "id": "S002",
                "invoice_number": "INV002",
                "customer": "Cliente 2",
                "date": "2023-10-14",
                "total": 2200.0,
                "status": "completed"
            }
        ],
        "total": 2,
        "limit": limit
    }))
}

async fn search_purchases(query: web::Query<SearchQuery>) -> impl Responder {
    // En una implementación real, buscaríamos compras en la base de datos
    let search_term = &query.q;
    let limit = query.limit.unwrap_or(10);
    
    HttpResponse::Ok().json(json!({
        "query": search_term,
        "results": [
            {
                "id": "P001",
                "reference_number": "REF001",
                "supplier": "Proveedor 1",
                "date": "2023-10-10",
                "total": 5000.0,
                "status": "received"
            }
        ],
        "total": 1,
        "limit": limit
    }))
}

async fn search_customers(query: web::Query<SearchQuery>) -> impl Responder {
    // En una implementación real, buscaríamos clientes en la base de datos
    let search_term = &query.q;
    let limit = query.limit.unwrap_or(10);
    
    HttpResponse::Ok().json(json!({
        "query": search_term,
        "results": [
            {
                "id": "C001",
                "name": "Cliente 1",
                "email": "cliente1@example.com",
                "phone": "123-456-7890",
                "address": "Dirección del Cliente 1"
            },
            {
                "id": "C002",
                "name": "Cliente 2",
                "email": "cliente2@example.com",
                "phone": "123-456-7891",
                "address": "Dirección del Cliente 2"
            }
        ],
        "total": 2,
        "limit": limit
    }))
}

async fn search_suppliers(query: web::Query<SearchQuery>) -> impl Responder {
    // En una implementación real, buscaríamos proveedores en la base de datos
    let search_term = &query.q;
    let limit = query.limit.unwrap_or(10);
    
    HttpResponse::Ok().json(json!({
        "query": search_term,
        "results": [
            {
                "id": "S001",
                "name": "Proveedor 1",
                "email": "proveedor1@example.com",
                "phone": "123-456-7892",
                "address": "Dirección del Proveedor 1"
            }
        ],
        "total": 1,
        "limit": limit
    }))
}

async fn search_users(query: web::Query<SearchQuery>) -> impl Responder {
    // En una implementación real, buscaríamos usuarios en la base de datos
    let search_term = &query.q;
    let limit = query.limit.unwrap_or(10);
    
    HttpResponse::Ok().json(json!({
        "query": search_term,
        "results": [
            {
                "id": "U001",
                "username": "admin",
                "name": "Administrador",
                "email": "admin@example.com",
                "role": "Administrador"
            },
            {
                "id": "U002",
                "username": "vendedor",
                "name": "Vendedor 1",
                "email": "vendedor@example.com",
                "role": "Vendedor"
            }
        ],
        "total": 2,
        "limit": limit
    }))
}