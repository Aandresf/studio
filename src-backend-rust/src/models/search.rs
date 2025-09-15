// src-backend-rust/src/models/search.rs

use crate::database_manager::DbPool;
use rusqlite::{params, Result as SqliteResult, Error as SqliteError};
use serde::{Deserialize, Serialize};
use log::{debug, error};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchResult {
    pub entity_type: String,
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
    pub additional_info: HashMap<String, String>,
}

pub struct Search;

impl Search {
    // Búsqueda global a través de múltiples entidades
    pub fn global_search(
        pool: &DbPool, 
        query: &str, 
        limit: Option<usize>
    ) -> SqliteResult<HashMap<String, Vec<SearchResult>>> {
        let mut results: HashMap<String, Vec<SearchResult>> = HashMap::new();
        let limit_val = limit.unwrap_or(10);
        
        // Búsqueda en productos
        let products = Self::search_products(pool, query, Some(limit_val))?;
        if !products.is_empty() {
            results.insert("products".to_string(), products);
        }
        
        // Búsqueda en clientes
        let customers = Self::search_customers(pool, query, Some(limit_val))?;
        if !customers.is_empty() {
            results.insert("customers".to_string(), customers);
        }
        
        // Búsqueda en proveedores
        let suppliers = Self::search_suppliers(pool, query, Some(limit_val))?;
        if !suppliers.is_empty() {
            results.insert("suppliers".to_string(), suppliers);
        }
        
        // Búsqueda en ventas
        let sales = Self::search_sales(pool, query, Some(limit_val))?;
        if !sales.is_empty() {
            results.insert("sales".to_string(), sales);
        }
        
        // Búsqueda en compras
        let purchases = Self::search_purchases(pool, query, Some(limit_val))?;
        if !purchases.is_empty() {
            results.insert("purchases".to_string(), purchases);
        }
        
        // Búsqueda en usuarios
        let users = Self::search_users(pool, query, Some(limit_val))?;
        if !users.is_empty() {
            results.insert("users".to_string(), users);
        }
        
        Ok(results)
    }
    
    // Buscar productos
    pub fn search_products(
        pool: &DbPool, 
        query: &str, 
        limit: Option<usize>
    ) -> SqliteResult<Vec<SearchResult>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let limit_val = limit.unwrap_or(10);
        let search_term = format!("%{}%", query);
        
        let mut stmt = conn.prepare(
            "SELECT p.id, p.name, p.description, p.code, p.created_at, b.name as brand_name, d.name as department_name 
             FROM products p
             LEFT JOIN brands b ON p.brand_id = b.id
             LEFT JOIN departments d ON p.department_id = d.id
             WHERE (p.name LIKE ? OR p.description LIKE ? OR p.code LIKE ?)
               AND (p.status IS NULL OR p.status <> 'deleted')
             ORDER BY p.name
             LIMIT ?"
        )?;
        
        let rows = stmt.query_map(params![search_term, search_term, search_term, limit_val as i64], |row| {
            let id: i64 = row.get(0)?;
            let name: String = row.get(1)?;
            let description: Option<String> = row.get(2)?;
            let code: String = row.get(3)?;
            let created_at: String = row.get(4)?;
            let brand_name: Option<String> = row.get(5)?;
            let department_name: Option<String> = row.get(6)?;
            
            let mut additional_info = HashMap::new();
            additional_info.insert("code".to_string(), code);
            
            if let Some(brand) = brand_name {
                additional_info.insert("brand".to_string(), brand);
            }
            
            if let Some(dept) = department_name {
                additional_info.insert("department".to_string(), dept);
            }
            
            Ok(SearchResult {
                entity_type: "product".to_string(),
                id,
                name,
                description,
                created_at,
                additional_info,
            })
        })?;
        
        let mut results: Vec<SearchResult> = Vec::new();
        for row in rows {
            results.push(row?);
        }
        
        Ok(results)
    }
    
    // Buscar clientes
    pub fn search_customers(
        pool: &DbPool, 
        query: &str, 
        limit: Option<usize>
    ) -> SqliteResult<Vec<SearchResult>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let limit_val = limit.unwrap_or(10);
        let search_term = format!("%{}%", query);
        
        let mut stmt = conn.prepare(
            "SELECT id, name, document_number, email, phone, created_at
             FROM customers_suppliers
             WHERE (name LIKE ? OR document_number LIKE ? OR email LIKE ?)
               AND type = 'customer'
               AND (status IS NULL OR status <> 'deleted')
             ORDER BY name
             LIMIT ?"
        )?;
        
        let rows = stmt.query_map(params![search_term, search_term, search_term, limit_val as i64], |row| {
            let id: i64 = row.get(0)?;
            let name: String = row.get(1)?;
            let document_number: Option<String> = row.get(2)?;
            let email: Option<String> = row.get(3)?;
            let phone: Option<String> = row.get(4)?;
            let created_at: String = row.get(5)?;
            
            let mut additional_info = HashMap::new();
            
            if let Some(doc) = document_number {
                additional_info.insert("document_number".to_string(), doc);
            }
            
            if let Some(mail) = email {
                additional_info.insert("email".to_string(), mail);
            }
            
            if let Some(ph) = phone {
                additional_info.insert("phone".to_string(), ph);
            }
            
            Ok(SearchResult {
                entity_type: "customer".to_string(),
                id,
                name,
                description: None,
                created_at,
                additional_info,
            })
        })?;
        
        let mut results: Vec<SearchResult> = Vec::new();
        for row in rows {
            results.push(row?);
        }
        
        Ok(results)
    }
    
    // Buscar proveedores
    pub fn search_suppliers(
        pool: &DbPool, 
        query: &str, 
        limit: Option<usize>
    ) -> SqliteResult<Vec<SearchResult>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let limit_val = limit.unwrap_or(10);
        let search_term = format!("%{}%", query);
        
        let mut stmt = conn.prepare(
            "SELECT id, name, document_number, email, phone, created_at
             FROM customers_suppliers
             WHERE (name LIKE ? OR document_number LIKE ? OR email LIKE ?)
               AND type = 'supplier'
               AND (status IS NULL OR status <> 'deleted')
             ORDER BY name
             LIMIT ?"
        )?;
        
        let rows = stmt.query_map(params![search_term, search_term, search_term, limit_val as i64], |row| {
            let id: i64 = row.get(0)?;
            let name: String = row.get(1)?;
            let document_number: Option<String> = row.get(2)?;
            let email: Option<String> = row.get(3)?;
            let phone: Option<String> = row.get(4)?;
            let created_at: String = row.get(5)?;
            
            let mut additional_info = HashMap::new();
            
            if let Some(doc) = document_number {
                additional_info.insert("document_number".to_string(), doc);
            }
            
            if let Some(mail) = email {
                additional_info.insert("email".to_string(), mail);
            }
            
            if let Some(ph) = phone {
                additional_info.insert("phone".to_string(), ph);
            }
            
            Ok(SearchResult {
                entity_type: "supplier".to_string(),
                id,
                name,
                description: None,
                created_at,
                additional_info,
            })
        })?;
        
        let mut results: Vec<SearchResult> = Vec::new();
        for row in rows {
            results.push(row?);
        }
        
        Ok(results)
    }
    
    // Buscar ventas
    pub fn search_sales(
        pool: &DbPool, 
        query: &str, 
        limit: Option<usize>
    ) -> SqliteResult<Vec<SearchResult>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let limit_val = limit.unwrap_or(10);
        let search_term = format!("%{}%", query);
        
        let mut stmt = conn.prepare(
            "SELECT t.id, t.reference_number, t.total, t.created_at, t.status, 
                    cs.name as customer_name, u.username as user_name
             FROM transactions t
             LEFT JOIN customers_suppliers cs ON t.customer_supplier_id = cs.id
             JOIN users u ON t.user_id = u.id
             WHERE (t.reference_number LIKE ? OR cs.name LIKE ?)
               AND t.transaction_type = 'sale'
             ORDER BY t.created_at DESC
             LIMIT ?"
        )?;
        
        let rows = stmt.query_map(params![search_term, search_term, limit_val as i64], |row| {
            let id: i64 = row.get(0)?;
            let reference_number: String = row.get(1)?;
            let total: f64 = row.get(2)?;
            let created_at: String = row.get(3)?;
            let status: String = row.get(4)?;
            let customer_name: Option<String> = row.get(5)?;
            let user_name: String = row.get(6)?;
            
            let mut additional_info = HashMap::new();
            additional_info.insert("reference_number".to_string(), reference_number.clone());
            additional_info.insert("total".to_string(), total.to_string());
            additional_info.insert("status".to_string(), status);
            additional_info.insert("user".to_string(), user_name);
            
            if let Some(cust) = customer_name {
                additional_info.insert("customer".to_string(), cust);
            }
            
            Ok(SearchResult {
                entity_type: "sale".to_string(),
                id,
                name: format!("Venta {}", reference_number),
                description: None,
                created_at,
                additional_info,
            })
        })?;
        
        let mut results: Vec<SearchResult> = Vec::new();
        for row in rows {
            results.push(row?);
        }
        
        Ok(results)
    }
    
    // Buscar compras
    pub fn search_purchases(
        pool: &DbPool, 
        query: &str, 
        limit: Option<usize>
    ) -> SqliteResult<Vec<SearchResult>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let limit_val = limit.unwrap_or(10);
        let search_term = format!("%{}%", query);
        
        let mut stmt = conn.prepare(
            "SELECT t.id, t.reference_number, t.invoice_number, t.total, t.created_at, t.status, 
                    cs.name as supplier_name, u.username as user_name
             FROM transactions t
             LEFT JOIN customers_suppliers cs ON t.customer_supplier_id = cs.id
             JOIN users u ON t.user_id = u.id
             WHERE (t.reference_number LIKE ? OR t.invoice_number LIKE ? OR cs.name LIKE ?)
               AND t.transaction_type = 'purchase'
             ORDER BY t.created_at DESC
             LIMIT ?"
        )?;
        
        let rows = stmt.query_map(params![search_term, search_term, search_term, limit_val as i64], |row| {
            let id: i64 = row.get(0)?;
            let reference_number: String = row.get(1)?;
            let invoice_number: Option<String> = row.get(2)?;
            let total: f64 = row.get(3)?;
            let created_at: String = row.get(4)?;
            let status: String = row.get(5)?;
            let supplier_name: Option<String> = row.get(6)?;
            let user_name: String = row.get(7)?;
            
            let mut additional_info = HashMap::new();
            additional_info.insert("reference_number".to_string(), reference_number.clone());
            additional_info.insert("total".to_string(), total.to_string());
            additional_info.insert("status".to_string(), status);
            additional_info.insert("user".to_string(), user_name);
            
            if let Some(inv) = invoice_number {
                additional_info.insert("invoice_number".to_string(), inv);
            }
            
            if let Some(supp) = supplier_name {
                additional_info.insert("supplier".to_string(), supp);
            }
            
            Ok(SearchResult {
                entity_type: "purchase".to_string(),
                id,
                name: format!("Compra {}", reference_number),
                description: None,
                created_at,
                additional_info,
            })
        })?;
        
        let mut results: Vec<SearchResult> = Vec::new();
        for row in rows {
            results.push(row?);
        }
        
        Ok(results)
    }
    
    // Buscar usuarios
    pub fn search_users(
        pool: &DbPool, 
        query: &str, 
        limit: Option<usize>
    ) -> SqliteResult<Vec<SearchResult>> {
        let conn = pool.get().map_err(|e| {
            error!("Error al obtener conexión del pool: {}", e);
            SqliteError::QueryReturnedNoRows
        })?;
        
        let limit_val = limit.unwrap_or(10);
        let search_term = format!("%{}%", query);
        
        let mut stmt = conn.prepare(
            "SELECT id, username, email, full_name, created_at, status, role_id
             FROM users
             WHERE (username LIKE ? OR email LIKE ? OR full_name LIKE ?)
               AND (status <> 'deleted')
             ORDER BY username
             LIMIT ?"
        )?;
        
        let rows = stmt.query_map(params![search_term, search_term, search_term, limit_val as i64], |row| {
            let id: i64 = row.get(0)?;
            let username: String = row.get(1)?;
            let email: String = row.get(2)?;
            let full_name: Option<String> = row.get(3)?;
            let created_at: String = row.get(4)?;
            let status: String = row.get(5)?;
            let role_id: i64 = row.get(6)?;
            
            let mut additional_info = HashMap::new();
            additional_info.insert("username".to_string(), username.clone());
            additional_info.insert("email".to_string(), email);
            additional_info.insert("status".to_string(), status);
            additional_info.insert("role_id".to_string(), role_id.to_string());
            
            let name = match full_name {
                Some(name) => name,
                None => username
            };
            
            Ok(SearchResult {
                entity_type: "user".to_string(),
                id,
                name,
                description: None,
                created_at,
                additional_info,
            })
        })?;
        
        let mut results: Vec<SearchResult> = Vec::new();
        for row in rows {
            results.push(row?);
        }
        
        Ok(results)
    }
}