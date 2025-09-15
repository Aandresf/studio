// src-backend-rust/src/routes/dashboard.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use chrono::{Utc, Duration};

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardQuery {
    period: Option<String>, // "today", "week", "month", "year"
}

// Configuración de rutas para el dashboard
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/dashboard")
            .route("", web::get().to(get_dashboard_data))
            .route("/sales-summary", web::get().to(get_sales_summary))
            .route("/top-products", web::get().to(get_top_products))
            .route("/stock-alerts", web::get().to(get_stock_alerts))
            .route("/revenue-chart", web::get().to(get_revenue_chart))
    );
}

// Controladores

async fn get_dashboard_data() -> impl Responder {
    // En una implementación real, consultaríamos y agregaríamos datos de ventas, inventario, etc.
    
    // Obtener fecha actual para simular datos de hoy
    let now = Utc::now();
    let today = now.format("%Y-%m-%d").to_string();
    
    HttpResponse::Ok().json(json!({
        "summary": {
            "sales_today": 15000.0,
            "sales_yesterday": 12500.0,
            "sales_week": 98000.0,
            "sales_month": 320000.0,
            "profit_today": 4500.0,
            "profit_month": 96000.0,
            "transactions_today": 25,
            "transactions_month": 450
        },
        "top_products": [
            {
                "id": "P001",
                "name": "Producto Top 1",
                "quantity_sold": 45,
                "sales_amount": 22500.0
            },
            {
                "id": "P002",
                "name": "Producto Top 2",
                "quantity_sold": 32,
                "sales_amount": 16000.0
            },
            {
                "id": "P003",
                "name": "Producto Top 3",
                "quantity_sold": 28,
                "sales_amount": 14000.0
            }
        ],
        "stock_alerts": [
            {
                "id": "P005",
                "name": "Producto Bajo Stock 1",
                "current_stock": 2.0,
                "min_stock": 5.0
            },
            {
                "id": "P008",
                "name": "Producto Bajo Stock 2",
                "current_stock": 1.0,
                "min_stock": 10.0
            }
        ],
        "revenue_chart": {
            "labels": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
            "data": [12000.0, 15000.0, 10000.0, 18000.0, 22000.0, 14000.0, 7000.0]
        },
        "date": today
    }))
}

async fn get_sales_summary(query: web::Query<DashboardQuery>) -> impl Responder {
    // En una implementación real, consultaríamos según el periodo solicitado
    let period = query.period.as_deref().unwrap_or("today");
    
    let sales_data = match period {
        "today" => json!({
            "total": 15000.0,
            "count": 25,
            "average": 600.0
        }),
        "week" => json!({
            "total": 98000.0,
            "count": 162,
            "average": 605.0
        }),
        "month" => json!({
            "total": 320000.0,
            "count": 450,
            "average": 711.0
        }),
        "year" => json!({
            "total": 3850000.0,
            "count": 5200,
            "average": 740.0
        }),
        _ => json!({
            "total": 15000.0,
            "count": 25,
            "average": 600.0
        })
    };
    
    HttpResponse::Ok().json(sales_data)
}

async fn get_top_products(query: web::Query<DashboardQuery>) -> impl Responder {
    // En una implementación real, consultaríamos los productos más vendidos
    HttpResponse::Ok().json(json!([
        {
            "id": "P001",
            "name": "Producto Top 1",
            "quantity_sold": 45,
            "sales_amount": 22500.0
        },
        {
            "id": "P002",
            "name": "Producto Top 2",
            "quantity_sold": 32,
            "sales_amount": 16000.0
        },
        {
            "id": "P003",
            "name": "Producto Top 3",
            "quantity_sold": 28,
            "sales_amount": 14000.0
        },
        {
            "id": "P004",
            "name": "Producto Top 4",
            "quantity_sold": 25,
            "sales_amount": 12500.0
        },
        {
            "id": "P006",
            "name": "Producto Top 5",
            "quantity_sold": 20,
            "sales_amount": 10000.0
        }
    ]))
}

async fn get_stock_alerts() -> impl Responder {
    // En una implementación real, consultaríamos productos con stock bajo
    HttpResponse::Ok().json(json!([
        {
            "id": "P005",
            "name": "Producto Bajo Stock 1",
            "current_stock": 2.0,
            "min_stock": 5.0
        },
        {
            "id": "P008",
            "name": "Producto Bajo Stock 2",
            "current_stock": 1.0,
            "min_stock": 10.0
        },
        {
            "id": "P012",
            "name": "Producto Bajo Stock 3",
            "current_stock": 3.0,
            "min_stock": 8.0
        }
    ]))
}

async fn get_revenue_chart(query: web::Query<DashboardQuery>) -> impl Responder {
    // En una implementación real, consultaríamos datos para el gráfico de ingresos
    let period = query.period.as_deref().unwrap_or("week");
    
    let chart_data = match period {
        "week" => json!({
            "labels": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
            "data": [12000.0, 15000.0, 10000.0, 18000.0, 22000.0, 14000.0, 7000.0]
        }),
        "month" => json!({
            "labels": ["Semana 1", "Semana 2", "Semana 3", "Semana 4"],
            "data": [75000.0, 82000.0, 90000.0, 73000.0]
        }),
        "year" => json!({
            "labels": ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
            "data": [320000.0, 305000.0, 330000.0, 290000.0, 310000.0, 350000.0,
                    370000.0, 380000.0, 320000.0, 300000.0, 340000.0, 400000.0]
        }),
        _ => json!({
            "labels": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
            "data": [12000.0, 15000.0, 10000.0, 18000.0, 22000.0, 14000.0, 7000.0]
        })
    };
    
    HttpResponse::Ok().json(chart_data)
}