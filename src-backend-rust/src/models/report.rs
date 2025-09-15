// src-backend-rust/src/models/report.rs

use crate::database_manager::DbPool;
use crate::excel_generator;
use rusqlite::{params, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use log::error;

#[derive(Debug, Serialize, Deserialize)]
pub struct SalesReport {
    pub date: String,
    pub total_sales: f64,
    pub total_items: i64,
    pub profit: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductReport {
    pub product_id: i64,
    pub product_name: String,
    pub variant_id: i64,
    pub sku: String,
    pub total_sold: i64,
    pub total_amount: f64,
    pub current_stock: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryReport {
    pub product_id: i64,
    pub product_name: String,
    pub variant_id: i64,
    pub sku: String,
    pub current_stock: f64,
    pub cost_price: f64,
    pub sale_price: f64,
    pub value: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CustomerReport {
    pub customer_id: i64,
    pub customer_name: String,
    pub total_purchases: i64,
    pub total_amount: f64,
    pub last_purchase_date: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReportParameters {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub period: Option<String>, // daily, weekly, monthly, yearly
    pub entity_id: Option<i64>, // customer_id, product_id, etc.
    pub format: Option<String>, // json, excel, csv
    pub filters: Option<HashMap<String, String>>, // custom filters
}

impl SalesReport {
    pub fn generate_report(
        pool: &DbPool,
        params: ReportParameters,
    ) -> SqliteResult<Vec<SalesReport>> {
        let conn = pool.get().unwrap();
        
        let mut sql = String::from(
            "SELECT 
                strftime('%Y-%m-%d', s.date) as date,
                SUM(s.total) as total_sales,
                SUM(si.quantity) as total_items,
                SUM(si.sale_price * si.quantity - si.cost_price * si.quantity) as profit
             FROM sales s
             JOIN sale_items si ON s.id = si.sale_id
             WHERE s.deleted_at IS NULL"
        );
        
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(start_date) = &params.start_date {
            sql.push_str(" AND s.date >= ?");
            params_vec.push(Box::new(start_date.clone()));
        }
        
        if let Some(end_date) = &params.end_date {
            sql.push_str(" AND s.date <= ?");
            params_vec.push(Box::new(end_date.clone()));
        }
        
        let group_by = match params.period.as_deref() {
            Some("day") => "%Y-%m-%d",
            Some("week") => "%Y-%W",
            Some("month") => "%Y-%m",
            Some("year") => "%Y",
            _ => "%Y-%m-%d", // default to daily
        };
        
        sql.push_str(&format!(" GROUP BY strftime('{}', s.date)", group_by));
        sql.push_str(" ORDER BY s.date");
        
        let mut stmt = conn.prepare(&sql)?;
        
        let params_slice: Vec<&dyn rusqlite::ToSql> = params_vec
            .iter()
            .map(|p| p.as_ref())
            .collect();
        
        let report_iter = stmt.query_map(params_slice.as_slice(), |row| {
            Ok(SalesReport {
                date: row.get(0)?,
                total_sales: row.get(1)?,
                total_items: row.get(2)?,
                profit: row.get(3)?,
            })
        })?;
        
        let mut reports = Vec::new();
        for report in report_iter {
            reports.push(report?);
        }
        
        Ok(reports)
    }
    
    pub fn export_to_excel(
        pool: &DbPool,
        params: ReportParameters,
    ) -> Result<Vec<u8>, String> {
        match Self::generate_report(pool, params) {
            Ok(reports) => {
                // Configuración del Excel
                let headers = vec!["Fecha", "Total Ventas", "Total Artículos", "Ganancia"];
                let mut data: Vec<Vec<String>> = Vec::new();
                
                for report in reports {
                    let row = vec![
                        report.date,
                        format!("{:.2}", report.total_sales),
                        report.total_items.to_string(),
                        match report.profit {
                            Some(profit) => format!("{:.2}", profit),
                            None => "N/A".to_string(),
                        },
                    ];
                    data.push(row);
                }
                
                // Generar Excel
                match excel_generator::generate_excel("Reporte de Ventas", &headers, &data) {
                    Ok(excel_data) => Ok(excel_data),
                    Err(e) => {
                        error!("Error al generar Excel: {}", e);
                        Err(format!("Error al generar Excel: {}", e))
                    }
                }
            },
            Err(e) => {
                error!("Error al generar reporte: {}", e);
                Err(format!("Error al generar reporte: {}", e))
            }
        }
    }
}

impl ProductReport {
    pub fn generate_report(
        pool: &DbPool,
        params: ReportParameters,
    ) -> SqliteResult<Vec<ProductReport>> {
        let conn = pool.get().unwrap();
        
        let mut sql = String::from(
            "SELECT 
                p.id as product_id,
                p.name as product_name,
                pv.id as variant_id,
                pv.sku as sku,
                SUM(si.quantity) as total_sold,
                SUM(si.quantity * si.sale_price) as total_amount,
                pv.current_stock as current_stock
             FROM products p
             JOIN product_variants pv ON p.id = pv.product_id
             LEFT JOIN sale_items si ON pv.id = si.variant_id
             LEFT JOIN sales s ON si.sale_id = s.id
             WHERE p.deleted_at IS NULL AND pv.deleted_at IS NULL"
        );
        
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(start_date) = &params.start_date {
            sql.push_str(" AND s.date >= ?");
            params_vec.push(Box::new(start_date.clone()));
        }
        
        if let Some(end_date) = &params.end_date {
            sql.push_str(" AND s.date <= ?");
            params_vec.push(Box::new(end_date.clone()));
        }
        
        if let Some(product_id) = &params.entity_id {
            sql.push_str(" AND p.id = ?");
            params_vec.push(Box::new(*product_id));
        }
        
        sql.push_str(" GROUP BY p.id, pv.id");
        sql.push_str(" ORDER BY total_sold DESC");
        
        let mut stmt = conn.prepare(&sql)?;
        
        let params_slice: Vec<&dyn rusqlite::ToSql> = params_vec
            .iter()
            .map(|p| p.as_ref())
            .collect();
        
        let report_iter = stmt.query_map(params_slice.as_slice(), |row| {
            Ok(ProductReport {
                product_id: row.get(0)?,
                product_name: row.get(1)?,
                variant_id: row.get(2)?,
                sku: row.get(3)?,
                total_sold: row.get(4)?,
                total_amount: row.get(5)?,
                current_stock: row.get(6)?,
            })
        })?;
        
        let mut reports = Vec::new();
        for report in report_iter {
            reports.push(report?);
        }
        
        Ok(reports)
    }
    
    pub fn export_to_excel(
        pool: &DbPool,
        params: ReportParameters,
    ) -> Result<Vec<u8>, String> {
        match Self::generate_report(pool, params) {
            Ok(reports) => {
                // Configuración del Excel
                let headers = vec!["ID Producto", "Nombre Producto", "ID Variante", "SKU", "Total Vendido", "Monto Total", "Stock Actual"];
                let mut data: Vec<Vec<String>> = Vec::new();
                
                for report in reports {
                    let row = vec![
                        report.product_id.to_string(),
                        report.product_name,
                        report.variant_id.to_string(),
                        report.sku,
                        report.total_sold.to_string(),
                        format!("{:.2}", report.total_amount),
                        format!("{:.2}", report.current_stock),
                    ];
                    data.push(row);
                }
                
                // Generar Excel
                match excel_generator::generate_excel("Reporte de Productos", &headers, &data) {
                    Ok(excel_data) => Ok(excel_data),
                    Err(e) => {
                        error!("Error al generar Excel: {}", e);
                        Err(format!("Error al generar Excel: {}", e))
                    }
                }
            },
            Err(e) => {
                error!("Error al generar reporte: {}", e);
                Err(format!("Error al generar reporte: {}", e))
            }
        }
    }
}

impl InventoryReport {
    pub fn generate_report(
        pool: &DbPool,
        params: ReportParameters,
    ) -> SqliteResult<Vec<InventoryReport>> {
        let conn = pool.get().unwrap();
        
        let mut sql = String::from(
            "SELECT 
                p.id as product_id,
                p.name as product_name,
                pv.id as variant_id,
                pv.sku as sku,
                pv.current_stock as current_stock,
                pv.cost_price as cost_price,
                pv.sale_price as sale_price,
                pv.current_stock * pv.cost_price as value
             FROM products p
             JOIN product_variants pv ON p.id = pv.product_id
             WHERE p.deleted_at IS NULL AND pv.deleted_at IS NULL"
        );
        
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        // Aplicar filtros adicionales si existen
        if let Some(filters) = &params.filters {
            if let Some(department_id) = filters.get("department_id") {
                if let Ok(id) = department_id.parse::<i64>() {
                    sql.push_str(" AND p.department_id = ?");
                    params_vec.push(Box::new(id));
                }
            }
            
            if let Some(brand_id) = filters.get("brand_id") {
                if let Ok(id) = brand_id.parse::<i64>() {
                    sql.push_str(" AND p.brand_id = ?");
                    params_vec.push(Box::new(id));
                }
            }
            
            if let Some(min_stock) = filters.get("min_stock") {
                if let Ok(stock) = min_stock.parse::<f64>() {
                    sql.push_str(" AND pv.current_stock >= ?");
                    params_vec.push(Box::new(stock));
                }
            }
            
            if let Some(max_stock) = filters.get("max_stock") {
                if let Ok(stock) = max_stock.parse::<f64>() {
                    sql.push_str(" AND pv.current_stock <= ?");
                    params_vec.push(Box::new(stock));
                }
            }
        }
        
        if let Some(product_id) = &params.entity_id {
            sql.push_str(" AND p.id = ?");
            params_vec.push(Box::new(*product_id));
        }
        
        sql.push_str(" ORDER BY value DESC");
        
        let mut stmt = conn.prepare(&sql)?;
        
        let params_slice: Vec<&dyn rusqlite::ToSql> = params_vec
            .iter()
            .map(|p| p.as_ref())
            .collect();
        
        let report_iter = stmt.query_map(params_slice.as_slice(), |row| {
            Ok(InventoryReport {
                product_id: row.get(0)?,
                product_name: row.get(1)?,
                variant_id: row.get(2)?,
                sku: row.get(3)?,
                current_stock: row.get(4)?,
                cost_price: row.get(5)?,
                sale_price: row.get(6)?,
                value: row.get(7)?,
            })
        })?;
        
        let mut reports = Vec::new();
        for report in report_iter {
            reports.push(report?);
        }
        
        Ok(reports)
    }
    
    pub fn export_to_excel(
        pool: &DbPool,
        params: ReportParameters,
    ) -> Result<Vec<u8>, String> {
        match Self::generate_report(pool, params) {
            Ok(reports) => {
                // Configuración del Excel
                let headers = vec!["ID Producto", "Nombre Producto", "ID Variante", "SKU", "Stock Actual", "Costo", "Precio Venta", "Valor Total"];
                let mut data: Vec<Vec<String>> = Vec::new();
                
                for report in reports {
                    let row = vec![
                        report.product_id.to_string(),
                        report.product_name,
                        report.variant_id.to_string(),
                        report.sku,
                        format!("{:.2}", report.current_stock),
                        format!("{:.2}", report.cost_price),
                        format!("{:.2}", report.sale_price),
                        format!("{:.2}", report.value),
                    ];
                    data.push(row);
                }
                
                // Generar Excel
                match excel_generator::generate_excel("Reporte de Inventario", &headers, &data) {
                    Ok(excel_data) => Ok(excel_data),
                    Err(e) => {
                        error!("Error al generar Excel: {}", e);
                        Err(format!("Error al generar Excel: {}", e))
                    }
                }
            },
            Err(e) => {
                error!("Error al generar reporte: {}", e);
                Err(format!("Error al generar reporte: {}", e))
            }
        }
    }
}

impl CustomerReport {
    pub fn generate_report(
        pool: &DbPool,
        params: ReportParameters,
    ) -> SqliteResult<Vec<CustomerReport>> {
        let conn = pool.get().unwrap();
        
        let mut sql = String::from(
            "SELECT 
                c.id as customer_id,
                c.name as customer_name,
                COUNT(s.id) as total_purchases,
                SUM(s.total) as total_amount,
                MAX(s.date) as last_purchase_date
             FROM customers c
             LEFT JOIN sales s ON c.id = s.customer_id
             WHERE c.deleted_at IS NULL AND s.deleted_at IS NULL"
        );
        
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(start_date) = &params.start_date {
            sql.push_str(" AND s.date >= ?");
            params_vec.push(Box::new(start_date.clone()));
        }
        
        if let Some(end_date) = &params.end_date {
            sql.push_str(" AND s.date <= ?");
            params_vec.push(Box::new(end_date.clone()));
        }
        
        if let Some(customer_id) = &params.entity_id {
            sql.push_str(" AND c.id = ?");
            params_vec.push(Box::new(*customer_id));
        }
        
        sql.push_str(" GROUP BY c.id");
        sql.push_str(" ORDER BY total_amount DESC");
        
        let mut stmt = conn.prepare(&sql)?;
        
        let params_slice: Vec<&dyn rusqlite::ToSql> = params_vec
            .iter()
            .map(|p| p.as_ref())
            .collect();
        
        let report_iter = stmt.query_map(params_slice.as_slice(), |row| {
            Ok(CustomerReport {
                customer_id: row.get(0)?,
                customer_name: row.get(1)?,
                total_purchases: row.get(2)?,
                total_amount: row.get(3)?,
                last_purchase_date: row.get(4)?,
            })
        })?;
        
        let mut reports = Vec::new();
        for report in report_iter {
            reports.push(report?);
        }
        
        Ok(reports)
    }
    
    pub fn export_to_excel(
        pool: &DbPool,
        params: ReportParameters,
    ) -> Result<Vec<u8>, String> {
        match Self::generate_report(pool, params) {
            Ok(reports) => {
                // Configuración del Excel
                let headers = vec!["ID Cliente", "Nombre Cliente", "Total Compras", "Monto Total", "Última Compra"];
                let mut data: Vec<Vec<String>> = Vec::new();
                
                for report in reports {
                    let row = vec![
                        report.customer_id.to_string(),
                        report.customer_name,
                        report.total_purchases.to_string(),
                        format!("{:.2}", report.total_amount),
                        report.last_purchase_date,
                    ];
                    data.push(row);
                }
                
                // Generar Excel
                match excel_generator::generate_excel("Reporte de Clientes", &headers, &data) {
                    Ok(excel_data) => Ok(excel_data),
                    Err(e) => {
                        error!("Error al generar Excel: {}", e);
                        Err(format!("Error al generar Excel: {}", e))
                    }
                }
            },
            Err(e) => {
                error!("Error al generar reporte: {}", e);
                Err(format!("Error al generar reporte: {}", e))
            }
        }
    }
}