// src-backend-rust/src/routes/search.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchQuery {
    q: String,
    limit: Option<usize>,
    entity_type: Option<String>, // "products", "sales", "purchases", "customers", "suppliers", etc.
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

async fn global_search(query: web::Query<SearchQuery>) -> impl Responder {
    // En una implementación real, buscaríamos en todas las entidades de la base de datos
    let search_term = &query.q;
    let limit = query.limit.unwrap_or(10);
    let entity_type = query.entity_type.as_deref();
    
    // Simulamos resultados de búsqueda
    let mut results = json!({});
    let mut results_obj = results.as_object_mut().unwrap();
    
    // Si se especifica un tipo de entidad, solo devolvemos resultados para ese tipo
    // De lo contrario, devolvemos resultados para todos los tipos
    
    if entity_type.is_none() || entity_type == Some("products") {
        results_obj.insert("products".to_string(), json!([
            {
                "id": "P001",
                "name": "Producto 1",
                "code": "PRD001",
                "type": "product"
            },
            {
                "id": "P002",
                "name": "Producto 2",
                "code": "PRD002",
                "type": "product"
            }
        ]));
    }
    
    if entity_type.is_none() || entity_type == Some("sales") {
        results_obj.insert("sales".to_string(), json!([
            {
                "id": "S001",
                "invoice_number": "INV001",
                "customer": "Cliente 1",
                "date": "2023-10-15",
                "type": "sale"
            }
        ]));
    }
    
    if entity_type.is_none() || entity_type == Some("customers") {
        results_obj.insert("customers".to_string(), json!([
            {
                "id": "C001",
                "name": "Cliente 1",
                "email": "cliente1@example.com",
                "type": "customer"
            }
        ]));
    }
    
    HttpResponse::Ok().json(json!({
        "query": search_term,
        "results": results,
        "total": 4,
        "limit": limit
    }))
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