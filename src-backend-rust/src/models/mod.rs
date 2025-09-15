// src-backend-rust/src/models/mod.rs

pub mod user;

// Exportamos los modelos para facilitar su importación
pub use user::{User, NewUser, UserUpdate, AuthRequest, AuthResponse, UserResponse};