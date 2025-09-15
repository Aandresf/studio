// src-backend-rust/src/routes/stats.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize)]
pub struct StatsQuery {
    start_date: Option<String>,
    end_date: Option<String>,
    period: Option<String>, // "day", "week", "month", "year"
    store_id: Option<String>,
}

// Configuración de rutas para estadísticas
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/stats")
            .route("/sales", web::get().to(get_sales_stats))
            .route("/products", web::get().to(get_product_stats))
            .route("/inventory", web::get().to(get_inventory_stats))
            .route("/customers", web::get().to(get_customer_stats))
            .route("/profit", web::get().to(get_profit_stats))
            .route("/trends", web::get().to(get_trend_stats))
    );
}

// Controladores

async fn get_sales_stats(query: web::Query<StatsQuery>) -> impl Responder {
    // En una implementación real, calcularíamos estadísticas de ventas desde la base de datos
    
    // Obtener fecha actual para simular datos
    let now = Utc::now();
    let today = now.format("%Y-%m-%d").to_string();
    
    HttpResponse::Ok().json(json!({
        "period": {
            "start": query.start_date.clone().unwrap_or_else(|| "2023-01-01".to_string()),
            "end": query.end_date.clone().unwrap_or_else(|| today)
        },
        "summary": {
            "total_sales": 450000.0,
            "total_transactions": 750,
            "average_sale": 600.0,
            "highest_sale": 5000.0,
            "lowest_sale": 50.0
        },
        "by_time": {
            "labels": ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
            "data": [35000.0, 38000.0, 40000.0, 37000.0, 42000.0, 45000.0, 
                    39000.0, 41000.0, 38000.0, 43000.0, 46000.0, 48000.0]
        },
        "by_category": [
            {
                "category": "Electrónicos",
                "value": 150000.0,
                "percentage": 33.3
            },
            {
                "category": "Muebles",
                "value": 120000.0,
                "percentage": 26.7
            },
            {
                "category": "Ropa",
                "value": 90000.0,
                "percentage": 20.0
            },
            {
                "category": "Accesorios",
                "value": 60000.0,
                "percentage": 13.3
            },
            {
                "category": "Otros",
                "value": 30000.0,
                "percentage": 6.7
            }
        ],
        "by_payment_method": [
            {
                "method": "Efectivo",
                "value": 180000.0,
                "percentage": 40.0
            },
            {
                "method": "Tarjeta de crédito",
                "value": 135000.0,
                "percentage": 30.0
            },
            {
                "method": "Transferencia",
                "value": 90000.0,
                "percentage": 20.0
            },
            {
                "method": "Otros",
                "value": 45000.0,
                "percentage": 10.0
            }
        ]
    }))
}

async fn get_product_stats(query: web::Query<StatsQuery>) -> impl Responder {
    // En una implementación real, calcularíamos estadísticas de productos desde la base de datos
    
    HttpResponse::Ok().json(json!({
        "top_selling": [
            {
                "id": "P001",
                "name": "Producto Top 1",
                "quantity_sold": 350,
                "revenue": 70000.0,
                "percentage": 15.6
            },
            {
                "id": "P002",
                "name": "Producto Top 2",
                "quantity_sold": 300,
                "revenue": 60000.0,
                "percentage": 13.3
            },
            {
                "id": "P003",
                "name": "Producto Top 3",
                "quantity_sold": 250,
                "revenue": 50000.0,
                "percentage": 11.1
            },
            {
                "id": "P004",
                "name": "Producto Top 4",
                "quantity_sold": 200,
                "revenue": 40000.0,
                "percentage": 8.9
            },
            {
                "id": "P005",
                "name": "Producto Top 5",
                "quantity_sold": 150,
                "revenue": 30000.0,
                "percentage": 6.7
            }
        ],
        "most_profitable": [
            {
                "id": "P001",
                "name": "Producto Top 1",
                "profit": 35000.0,
                "profit_margin": 50.0,
                "percentage": 17.5
            },
            {
                "id": "P003",
                "name": "Producto Top 3",
                "profit": 30000.0,
                "profit_margin": 60.0,
                "percentage": 15.0
            },
            {
                "id": "P002",
                "name": "Producto Top 2",
                "profit": 25000.0,
                "profit_margin": 41.7,
                "percentage": 12.5
            }
        ],
        "by_category": [
            {
                "category": "Electrónicos",
                "quantity_sold": 800,
                "revenue": 150000.0,
                "percentage": 33.3
            },
            {
                "category": "Muebles",
                "quantity_sold": 600,
                "revenue": 120000.0,
                "percentage": 26.7
            },
            {
                "category": "Ropa",
                "quantity_sold": 1200,
                "revenue": 90000.0,
                "percentage": 20.0
            }
        ],
        "low_performing": [
            {
                "id": "P100",
                "name": "Producto Bajo Rendimiento 1",
                "quantity_sold": 5,
                "revenue": 1000.0,
                "days_without_sales": 45
            },
            {
                "id": "P101",
                "name": "Producto Bajo Rendimiento 2",
                "quantity_sold": 3,
                "revenue": 600.0,
                "days_without_sales": 60
            }
        ]
    }))
}

async fn get_inventory_stats(query: web::Query<StatsQuery>) -> impl Responder {
    // En una implementación real, calcularíamos estadísticas de inventario desde la base de datos
    
    HttpResponse::Ok().json(json!({
        "summary": {
            "total_items": 1250,
            "total_value": 500000.0,
            "average_item_value": 400.0,
            "low_stock_items": 15,
            "out_of_stock_items": 5
        },
        "by_category": [
            {
                "category": "Electrónicos",
                "items": 350,
                "value": 200000.0,
                "percentage": 40.0
            },
            {
                "category": "Muebles",
                "items": 250,
                "value": 150000.0,
                "percentage": 30.0
            },
            {
                "category": "Ropa",
                "items": 450,
                "value": 100000.0,
                "percentage": 20.0
            },
            {
                "category": "Accesorios",
                "items": 200,
                "value": 50000.0,
                "percentage": 10.0
            }
        ],
        "turnover_rate": {
            "overall": 5.2,
            "by_category": [
                {
                    "category": "Electrónicos",
                    "rate": 6.8
                },
                {
                    "category": "Muebles",
                    "rate": 2.5
                },
                {
                    "category": "Ropa",
                    "rate": 8.3
                },
                {
                    "category": "Accesorios",
                    "rate": 4.7
                }
            ]
        },
        "most_stocked": [
            {
                "id": "P050",
                "name": "Producto con Más Stock 1",
                "quantity": 120.0,
                "value": 24000.0
            },
            {
                "id": "P051",
                "name": "Producto con Más Stock 2",
                "quantity": 100.0,
                "value": 15000.0
            }
        ],
        "low_stock": [
            {
                "id": "P005",
                "name": "Producto Bajo Stock 1",
                "current_stock": 2.0,
                "min_stock": 5.0,
                "max_stock": 20.0,
                "recommended_purchase": 18.0
            },
            {
                "id": "P008",
                "name": "Producto Bajo Stock 2",
                "current_stock": 1.0,
                "min_stock": 10.0,
                "max_stock": 30.0,
                "recommended_purchase": 29.0
            }
        ]
    }))
}

async fn get_customer_stats(query: web::Query<StatsQuery>) -> impl Responder {
    // En una implementación real, calcularíamos estadísticas de clientes desde la base de datos
    
    HttpResponse::Ok().json(json!({
        "summary": {
            "total_customers": 450,
            "active_customers": 325,
            "inactive_customers": 125,
            "new_customers": 35,
            "average_purchase": 600.0
        },
        "top_customers": [
            {
                "id": "C001",
                "name": "Cliente Top 1",
                "purchases": 25,
                "total_spent": 45000.0,
                "average_purchase": 1800.0,
                "last_purchase": "2023-10-10"
            },
            {
                "id": "C002",
                "name": "Cliente Top 2",
                "purchases": 18,
                "total_spent": 36000.0,
                "average_purchase": 2000.0,
                "last_purchase": "2023-10-15"
            },
            {
                "id": "C003",
                "name": "Cliente Top 3",
                "purchases": 15,
                "total_spent": 30000.0,
                "average_purchase": 2000.0,
                "last_purchase": "2023-10-05"
            }
        ],
        "customer_growth": {
            "labels": ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
            "data": [10, 12, 15, 8, 14, 9, 11, 7, 13, 16, 10, 12]
        },
        "purchase_frequency": {
            "once": {
                "count": 150,
                "percentage": 33.3
            },
            "occasional": {
                "count": 175,
                "percentage": 38.9
            },
            "regular": {
                "count": 95,
                "percentage": 21.1
            },
            "frequent": {
                "count": 30,
                "percentage": 6.7
            }
        },
        "at_risk": [
            {
                "id": "C050",
                "name": "Cliente en Riesgo 1",
                "days_since_last_purchase": 120,
                "total_spent": 25000.0,
                "typical_frequency_days": 30
            },
            {
                "id": "C051",
                "name": "Cliente en Riesgo 2",
                "days_since_last_purchase": 90,
                "total_spent": 18000.0,
                "typical_frequency_days": 25
            }
        ]
    }))
}

async fn get_profit_stats(query: web::Query<StatsQuery>) -> impl Responder {
    // En una implementación real, calcularíamos estadísticas de ganancias desde la base de datos
    
    HttpResponse::Ok().json(json!({
        "period": {
            "start": query.start_date.clone().unwrap_or_else(|| "2023-01-01".to_string()),
            "end": query.end_date.clone().unwrap_or_else(|| Utc::now().format("%Y-%m-%d").to_string())
        },
        "summary": {
            "total_revenue": 450000.0,
            "total_cost": 250000.0,
            "gross_profit": 200000.0,
            "average_margin": 44.4,
            "highest_margin_product": {
                "id": "P003",
                "name": "Producto Top 3",
                "margin": 60.0
            },
            "lowest_margin_product": {
                "id": "P020",
                "name": "Producto Margen Bajo",
                "margin": 15.0
            }
        },
        "by_time": {
            "labels": ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
            "revenue": [35000.0, 38000.0, 40000.0, 37000.0, 42000.0, 45000.0, 
                       39000.0, 41000.0, 38000.0, 43000.0, 46000.0, 48000.0],
            "cost": [21000.0, 22800.0, 24000.0, 22200.0, 25200.0, 27000.0, 
                    23400.0, 24600.0, 22800.0, 25800.0, 27600.0, 28800.0],
            "profit": [14000.0, 15200.0, 16000.0, 14800.0, 16800.0, 18000.0, 
                      15600.0, 16400.0, 15200.0, 17200.0, 18400.0, 19200.0],
            "margin": [40.0, 40.0, 40.0, 40.0, 40.0, 40.0, 40.0, 40.0, 40.0, 40.0, 40.0, 40.0]
        },
        "by_category": [
            {
                "category": "Electrónicos",
                "revenue": 150000.0,
                "cost": 90000.0,
                "profit": 60000.0,
                "margin": 40.0
            },
            {
                "category": "Muebles",
                "revenue": 120000.0,
                "cost": 66000.0,
                "profit": 54000.0,
                "margin": 45.0
            },
            {
                "category": "Ropa",
                "revenue": 90000.0,
                "cost": 45000.0,
                "profit": 45000.0,
                "margin": 50.0
            },
            {
                "category": "Accesorios",
                "revenue": 60000.0,
                "cost": 33000.0,
                "profit": 27000.0,
                "margin": 45.0
            },
            {
                "category": "Otros",
                "revenue": 30000.0,
                "cost": 16000.0,
                "profit": 14000.0,
                "margin": 46.7
            }
        ]
    }))
}

async fn get_trend_stats(query: web::Query<StatsQuery>) -> impl Responder {
    // En una implementación real, calcularíamos tendencias desde la base de datos
    
    HttpResponse::Ok().json(json!({
        "sales_trend": {
            "period": query.period.clone().unwrap_or_else(|| "month".to_string()),
            "direction": "up",
            "percentage": 8.5,
            "comparison": "previous_period"
        },
        "customer_trend": {
            "period": query.period.clone().unwrap_or_else(|| "month".to_string()),
            "direction": "up",
            "percentage": 5.2,
            "comparison": "previous_period"
        },
        "profit_trend": {
            "period": query.period.clone().unwrap_or_else(|| "month".to_string()),
            "direction": "up",
            "percentage": 7.8,
            "comparison": "previous_period"
        },
        "category_trends": [
            {
                "category": "Electrónicos",
                "direction": "up",
                "percentage": 12.5
            },
            {
                "category": "Muebles",
                "direction": "down",
                "percentage": 3.2
            },
            {
                "category": "Ropa",
                "direction": "up",
                "percentage": 6.8
            }
        ],
        "predicted_sales": {
            "next_month": 48500.0,
            "next_quarter": 150000.0,
            "confidence": "medium"
        }
    }))
}