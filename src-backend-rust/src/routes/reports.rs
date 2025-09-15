// src-backend-rust/src/routes/reports.rs

use actix_web::{web, HttpResponse, Responder, http::header};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use serde_json::json;
use crate::excel_generator::ExcelGenerator;

#[derive(Debug, Serialize, Deserialize)]
pub struct ReportQuery {
    start_date: Option<DateTime<Utc>>,
    end_date: Option<DateTime<Utc>>,
    report_type: Option<String>,
    format: Option<String>,
}

// Configuración de rutas para reportes
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/reports")
            .route("/sales", web::get().to(sales_report))
            .route("/inventory", web::get().to(inventory_report))
            .route("/purchases", web::get().to(purchases_report))
            .route("/profits", web::get().to(profits_report))
    );
}

// Controladores

async fn sales_report(query: web::Query<ReportQuery>) -> impl Responder {
    // En una implementación real, consultaríamos la base de datos
    // y formatearíamos los datos según el tipo de reporte solicitado
    
    // Ejemplo de datos para el reporte
    let data = json!([
        {
            "date": "2023-09-01",
            "sales_count": 12,
            "total": 15000.0
        },
        {
            "date": "2023-09-02",
            "sales_count": 8,
            "total": 9500.0
        },
        {
            "date": "2023-09-03",
            "sales_count": 15,
            "total": 18200.0
        }
    ]);
    
    // Si se solicita formato Excel, generaríamos el archivo
    if let Some(format) = &query.format {
        if format == "excel" {
            // En una implementación real, usaríamos ExcelGenerator
            // para crear un archivo Excel y devolverlo
            return HttpResponse::Ok()
                .append_header(("Content-Disposition", "attachment; filename=\"sales_report.xlsx\""))
                .json(json!({
                    "message": "La generación de Excel aún no está implementada en esta versión de Rust"
                }));
        }
    }
    
    // Por defecto, devolver JSON
    HttpResponse::Ok().json(data)
}

async fn inventory_report(query: web::Query<ReportQuery>) -> impl Responder {
    // En una implementación real, consultaríamos la base de datos
    
    // Ejemplo de datos para el reporte
    let data = json!([
        {
            "id": "P001",
            "name": "Producto 1",
            "sku": "SKU001",
            "stock": 25.0,
            "cost_price": 300.0,
            "sales_price": 450.0,
            "total_value": 7500.0
        },
        {
            "id": "P002",
            "name": "Producto 2",
            "sku": "SKU002",
            "stock": 15.0,
            "cost_price": 400.0,
            "sales_price": 600.0,
            "total_value": 6000.0
        }
    ]);
    
    // Si se solicita formato Excel, generaríamos el archivo
    if let Some(format) = &query.format {
        if format == "excel" {
            // En una implementación real, usaríamos ExcelGenerator
            return HttpResponse::Ok()
                .append_header(("Content-Disposition", "attachment; filename=\"inventory_report.xlsx\""))
                .json(json!({
                    "message": "La generación de Excel aún no está implementada en esta versión de Rust"
                }));
        }
    }
    
    // Por defecto, devolver JSON
    HttpResponse::Ok().json(data)
}

async fn purchases_report(query: web::Query<ReportQuery>) -> impl Responder {
    // Implementación similar a los otros reportes
    HttpResponse::Ok().json(json!([
        {
            "date": "2023-09-01",
            "purchases_count": 3,
            "total": 12000.0
        },
        {
            "date": "2023-09-10",
            "purchases_count": 2,
            "total": 8500.0
        }
    ]))
}

async fn profits_report(query: web::Query<ReportQuery>) -> impl Responder {
    // Implementación similar a los otros reportes
    HttpResponse::Ok().json(json!([
        {
            "date": "2023-09-01",
            "sales_total": 15000.0,
            "cost_total": 10000.0,
            "profit": 5000.0,
            "margin": 33.33
        },
        {
            "date": "2023-09-02",
            "sales_total": 9500.0,
            "cost_total": 6300.0,
            "profit": 3200.0,
            "margin": 33.68
        }
    ]))
}