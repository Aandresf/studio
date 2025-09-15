// src-backend-rust/src/routes/mod.rs

// Exportamos los módulos de rutas
pub mod admin;
pub mod attributes;
pub mod auth;
pub mod brands;
pub mod customers;
pub mod dashboard;
pub mod departments;
pub mod inventory;
pub mod products;
pub mod purchases;
pub mod reports;
pub mod role_permissions;
pub mod sales;
pub mod search;
pub mod settings;
pub mod snapshots;
pub mod stats;
pub mod stores;
pub mod suppliers;
pub mod users;

use actix_web::web;

// Función para configurar todas las rutas
pub fn init(cfg: &mut web::ServiceConfig) {
    admin::init(cfg);
    attributes::init(cfg);
    auth::init(cfg);
    brands::init(cfg);
    customers::init(cfg);
    dashboard::init(cfg);
    departments::init(cfg);
    inventory::init(cfg);
    products::init(cfg);
    purchases::init(cfg);
    reports::init(cfg);
    role_permissions::init(cfg);
    sales::init(cfg);
    search::init(cfg);
    settings::init(cfg);
    snapshots::init(cfg);
    stats::init(cfg);
    stores::init(cfg);
    suppliers::init(cfg);
    users::init(cfg);
}