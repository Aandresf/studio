
// src-backend-rust/src/routes/reports.rs

use actix_web::{web, HttpResponse, Responder, http::header};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Deserialize)]
pub struct ReportQuery {
    start_date: Option<String>,
    end_date: Option<String>,
    format: Option<String>,
}

pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/reports")
            .route("", web::get().to(get_reports))
            .route("/products", web::get().to(get_product_report))
            .route("/inventory", web::get().to(get_inventory_report))
            .route("/customers", web::get().to(get_customer_report))
            .route("/historical-summary", web::get().to(get_historical_summary))
            .route("/preview", web::post().to(get_report_preview))
            .route("/inventory-excel", web::get().to(get_inventory_excel))
            .route("/inventory-as-of", web::get().to(get_inventory_as_of))
            .route("/sales-excel", web::post().to(get_sales_excel))
            .route("/purchases-excel", web::post().to(get_purchases_excel))
            .route("/{id}", web::get().to(get_report_by_id))
    );
}

async fn get_reports() -> impl Responder {
    HttpResponse::Ok().json(json!([
        {
            "id": 1,
            "name": "Reporte de Productos",
            "description": "Lista completa de productos y variantes",
            "type": "products"
        },
        {
            "id": 2,
            "name": "Reporte de Inventario",
            "description": "Estado actual del inventario",
            "type": "inventory"
        },
        {
            "id": 3,
            "name": "Reporte de Ventas",
            "description": "Resumen de ventas por período",
            "type": "sales"
        },
        {
            "id": 4,
            "name": "Reporte de Compras",
            "description": "Resumen de compras por período", 
            "type": "purchases"
        }
    ]))
}

async fn get_product_report() -> impl Responder {
    HttpResponse::Ok().json(json!({
        "title": "Reporte de Productos",
        "generated_at": chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        "products": [
            {
                "id": 1,
                "name": "Producto A",
                "variants": 3,
                "total_stock": 45,
                "total_value": 2250.0
            },
            {
                "id": 2,
                "name": "Producto B",
                "variants": 2,
                "total_stock": 30,
                "total_value": 1500.0
            }
        ]
    }))
}

async fn get_inventory_report() -> impl Responder {
    HttpResponse::Ok().json(json!({
        "title": "Reporte de Inventario",
        "generated_at": chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        "summary": {
            "total_products": 150,
            "total_variants": 300,
            "total_value": 45000.0,
            "low_stock_items": 5
        },
        "items": [
            {
                "sku": "SKU001",
                "product": "Producto A",
                "stock": 10,
                "value": 500.0,
                "status": "normal"
            },
            {
                "sku": "SKU002", 
                "product": "Producto B",
                "stock": 2,
                "value": 100.0,
                "status": "low_stock"
            }
        ]
    }))
}

async fn get_customer_report() -> impl Responder {
    HttpResponse::Ok().json(json!({
        "title": "Reporte de Clientes",
        "generated_at": chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        "customers": [
            {
                "id": 1,
                "name": "Juan Pérez",
                "total_purchases": 1250.0,
                "last_purchase": "2024-01-15"
            },
            {
                "id": 2,
                "name": "María González",
                "total_purchases": 890.0,
                "last_purchase": "2024-01-10"
            }
        ]
    }))
}

async fn get_historical_summary(
    query: web::Query<ReportQuery>
) -> impl Responder {
    HttpResponse::Ok().json(json!({
        "period": {
            "start": query.start_date.as_deref().unwrap_or("2024-01-01"),
            "end": query.end_date.as_deref().unwrap_or("2024-01-31")
        },
        "sales": {
            "total": 45000.0,
            "transactions": 180,
            "average": 250.0
        },
        "purchases": {
            "total": 28000.0,
            "transactions": 65,
            "average": 430.77
        },
        "profit": {
            "gross": 17000.0,
            "margin": 37.78
        }
    }))
}

async fn get_report_preview(
    body: web::Json<serde_json::Value>
) -> impl Responder {
    HttpResponse::Ok().json(json!({
        "preview": "Vista previa del reporte",
        "parameters": body.into_inner(),
        "estimated_rows": 150
    }))
}

async fn get_inventory_excel() -> impl Responder {
    // Simular generación de Excel
    let csv_data = "SKU,Producto,Stock,Valor\nSKU001,Producto A,10,500.00\nSKU002,Producto B,25,1250.00";
    
    HttpResponse::Ok()
        .append_header((header::CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .append_header((header::CONTENT_DISPOSITION, "attachment; filename=\"inventario.xlsx\""))
        .body(csv_data)
}

async fn get_inventory_as_of(
    query: web::Query<ReportQuery>
) -> impl Responder {
    let date = query.start_date.as_deref().unwrap_or("2024-01-15");
    let csv_data = format!("Inventario al {},SKU,Producto,Stock\n,SKU001,Producto A,10\n,SKU002,Producto B,25", date);
    
    HttpResponse::Ok()
        .append_header((header::CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .append_header((header::CONTENT_DISPOSITION, "attachment; filename=\"inventario_al_date.xlsx\""))
        .body(csv_data)
}

async fn get_sales_excel(
    body: web::Json<serde_json::Value>
) -> impl Responder {
    let csv_data = "Fecha,Cliente,Total,Items\n2024-01-15,Juan Pérez,150.00,2\n2024-01-15,María González,89.50,1";
    
    HttpResponse::Ok()
        .append_header((header::CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .append_header((header::CONTENT_DISPOSITION, "attachment; filename=\"ventas.xlsx\""))
        .body(csv_data)
}

async fn get_purchases_excel(
    body: web::Json<serde_json::Value>
) -> impl Responder {
    let csv_data = "Fecha,Proveedor,Total,Items\n2024-01-15,Proveedor ABC,1250.00,5\n2024-01-14,Proveedor XYZ,890.00,3";
    
    HttpResponse::Ok()
        .append_header((header::CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .append_header((header::CONTENT_DISPOSITION, "attachment; filename=\"compras.xlsx\""))
        .body(csv_data)
}

async fn get_report_by_id(
    path: web::Path<i32>
) -> impl Responder {
    let id = path.into_inner();
    
    HttpResponse::Ok().json(json!({
        "id": id,
        "name": format!("Reporte #{}", id),
        "data": {
            "generated_at": chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            "content": "Contenido del reporte"
        }
    }))
}
