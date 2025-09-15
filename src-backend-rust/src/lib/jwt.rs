// src-backend-rust/src/lib/jwt.rs

use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey, errors::Error as JwtError};
use serde::{Serialize, Deserialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,        // Subject (username o ID de usuario)
    pub exp: usize,         // Tiempo de expiración
    pub iat: usize,         // Tiempo de emisión
    pub role_id: Option<String>, // ID del rol del usuario
    pub user_id: String,    // ID del usuario
}

pub fn generate_token(user_id: &str, username: &str, role_id: Option<&str>, secret: &str) -> Result<String, JwtError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Error al obtener el tiempo")
        .as_secs() as usize;
    
    // El token expira en 24 horas
    let expiration = now + 24 * 60 * 60;
    
    let claims = Claims {
        sub: username.to_string(),
        exp: expiration,
        iat: now,
        role_id: role_id.map(|r| r.to_string()),
        user_id: user_id.to_string(),
    };
    
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

pub fn validate_token(token: &str, secret: &str) -> Result<Claims, JwtError> {
    let validation = Validation::new(Algorithm::HS256);
    
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )?;
    
    Ok(token_data.claims)
}