// src-backend-rust/src/routes/reports.rs

use actix_web::{web, HttpResponse, Responder, http::header};
use crate::database_manager::DbPool;
use crate::models::{SalesReport, ProductReport, InventoryReport, CustomerReport, ReportParameters};
use serde::{Deserialize, Serialize};
use log::{error, info};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct ReportQuery {
    start_date: Option<String>,
    end_date: Option<String>,
    period: Option<String>,
    entity_id: Option<i64>,
    format: Option<String>,
    #[serde(flatten)]
    filters: HashMap<String, String>,
}

// Configuración de rutas para reportes
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/reports")
            .route("/sales", web::get().to(get_sales_report))
            .route("/products", web::get().to(get_product_report))
            .route("/inventory", web::get().to(get_inventory_report))
            .route("/customers", web::get().to(get_customer_report))
    );
}

// Controladores
async fn get_sales_report(query: web::Query<ReportQuery>, pool: web::Data<DbPool>) -> impl Responder {
    info!("Generando reporte de ventas con parámetros: {:?}", query);
    
    let params = ReportParameters {
        start_date: query.start_date.clone(),
        end_date: query.end_date.clone(),
        period: query.period.clone(),
        entity_id: query.entity_id,
        format: query.format.clone(),
        filters: Some(query.filters.clone()),
    };
    
    match query.format.as_deref() {
        Some("excel") => {
            match SalesReport::export_to_excel(&pool, params) {
                Ok(excel_data) => {
                    HttpResponse::Ok()
                        .content_type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        .insert_header(header::ContentDisposition {
                            disposition: header::DispositionType::Attachment,
                            parameters: vec![header::DispositionParam::Filename(
                                header::Charset::Ext("UTF-8".into()),
                                None,
                                "reporte_ventas.xlsx".as_bytes().to_vec(),
                            )],
                        })
                        .body(excel_data)
                },
                Err(e) => {
                    error!("Error al exportar reporte de ventas a Excel: {}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({"error": e}))
                },
            }
        },
        _ => {
            // Formato JSON por defecto
            match SalesReport::generate_report(&pool, params) {
                Ok(report) => HttpResponse::Ok().json(report),
                Err(e) => {
                    error!("Error al generar reporte de ventas: {}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": format!("Error al generar reporte de ventas: {}", e)
                    }))
                },
            }
        },
    }
async fn get_product_report(query: web::Query<ReportQuery>, pool: web::Data<DbPool>) -> impl Responder {
    info!("Generando reporte de productos con parámetros: {:?}", query);
    
    let params = ReportParameters {
        start_date: query.start_date.clone(),
        end_date: query.end_date.clone(),
        period: query.period.clone(),
        entity_id: query.entity_id,
        format: query.format.clone(),
        filters: Some(query.filters.clone()),
    };
    
    match query.format.as_deref() {
        Some("excel") => {
            match ProductReport::export_to_excel(&pool, params) {
                Ok(excel_data) => {
                    HttpResponse::Ok()
                        .content_type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        .insert_header(header::ContentDisposition {
                            disposition: header::DispositionType::Attachment,
                            parameters: vec![header::DispositionParam::Filename(
                                header::Charset::Ext("UTF-8".into()),
                                None,
                                "reporte_productos.xlsx".as_bytes().to_vec(),
                            )],
                        })
                        .body(excel_data)
                },
                Err(e) => {
                    error!("Error al exportar reporte de productos a Excel: {}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({"error": e}))
                },
            }
        },
        _ => {
            // Formato JSON por defecto
            match ProductReport::generate_report(&pool, params) {
                Ok(report) => HttpResponse::Ok().json(report),
                Err(e) => {
                    error!("Error al generar reporte de productos: {}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": format!("Error al generar reporte de productos: {}", e)
                    }))
                },
            }
        },
    }
}

async fn get_inventory_report(query: web::Query<ReportQuery>, pool: web::Data<DbPool>) -> impl Responder {
    info!("Generando reporte de inventario con parámetros: {:?}", query);
    
    let params = ReportParameters {
        start_date: query.start_date.clone(),
        end_date: query.end_date.clone(),
        period: query.period.clone(),
        entity_id: query.entity_id,
        format: query.format.clone(),
        filters: Some(query.filters.clone()),
    };
    
    match query.format.as_deref() {
        Some("excel") => {
            match InventoryReport::export_to_excel(&pool, params) {
                Ok(excel_data) => {
                    HttpResponse::Ok()
                        .content_type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        .insert_header(header::ContentDisposition {
                            disposition: header::DispositionType::Attachment,
                            parameters: vec![header::DispositionParam::Filename(
                                header::Charset::Ext("UTF-8".into()),
                                None,
                                "reporte_inventario.xlsx".as_bytes().to_vec(),
                            )],
                        })
                        .body(excel_data)
                },
                Err(e) => {
                    error!("Error al exportar reporte de inventario a Excel: {}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({"error": e}))
                },
            }
        },
        _ => {
            // Formato JSON por defecto
            match InventoryReport::generate_report(&pool, params) {
                Ok(report) => HttpResponse::Ok().json(report),
                Err(e) => {
                    error!("Error al generar reporte de inventario: {}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": format!("Error al generar reporte de inventario: {}", e)
                    }))
                },
            }
        },
    }
}

async fn get_customer_report(query: web::Query<ReportQuery>, pool: web::Data<DbPool>) -> impl Responder {
    info!("Generando reporte de clientes con parámetros: {:?}", query);
    
    let params = ReportParameters {
        start_date: query.start_date.clone(),
        end_date: query.end_date.clone(),
        period: query.period.clone(),
        entity_id: query.entity_id,
        format: query.format.clone(),
        filters: Some(query.filters.clone()),
    };
    
    match query.format.as_deref() {
        Some("excel") => {
            match CustomerReport::export_to_excel(&pool, params) {
                Ok(excel_data) => {
                    HttpResponse::Ok()
                        .content_type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        .insert_header(header::ContentDisposition {
                            disposition: header::DispositionType::Attachment,
                            parameters: vec![header::DispositionParam::Filename(
                                header::Charset::Ext("UTF-8".into()),
                                None,
                                "reporte_clientes.xlsx".as_bytes().to_vec(),
                            )],
                        })
                        .body(excel_data)
                },
                Err(e) => {
                    error!("Error al exportar reporte de clientes a Excel: {}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({"error": e}))
                },
            }
        },
        _ => {
            // Formato JSON por defecto
            match CustomerReport::generate_report(&pool, params) {
                Ok(report) => HttpResponse::Ok().json(report),
                Err(e) => {
                    error!("Error al generar reporte de clientes: {}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": format!("Error al generar reporte de clientes: {}", e)
                    }))
                },
            }
        },
    }
}
}