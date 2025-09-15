// src-backend-rust/src/middleware/auth.rs

use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    http::header::HeaderValue,
    web, Error, HttpMessage,
};
use futures::future::{ready, LocalBoxFuture, Ready};
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;
use log::{debug, error};

use crate::lib::jwt;
use crate::config::Settings;

// Rutas que no requieren autenticación
const PUBLIC_ROUTES: [&str; 3] = [
    "/api/auth/login",
    "/api/auth/verify",
    "/api/health",
];

pub struct Auth;

impl<S, B> Transform<S, ServiceRequest> for Auth
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = AuthMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddleware { service: Rc::new(service) }))
    }
}

pub struct AuthMiddleware<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = Rc::clone(&self.service);
        
        Box::pin(async move {
            // Obtener el path de la solicitud
            let path = req.path();
            
            // Verificar si es una ruta pública
            if PUBLIC_ROUTES.iter().any(|route| path.starts_with(route)) {
                return service.call(req).await;
            }
            
            // Intentar obtener el token de las cookies
            let mut token: Option<String> = None;
            
            if let Some(cookie) = req.cookie("session") {
                token = Some(cookie.value().to_string());
            }
            
            // Si no hay token en las cookies, intentar obtenerlo del encabezado Authorization
            if token.is_none() {
                if let Some(auth_header) = req.headers().get("Authorization") {
                    if let Ok(auth_str) = auth_header.to_str() {
                        if auth_str.starts_with("Bearer ") {
                            token = Some(auth_str[7..].to_string());
                        }
                    }
                }
            }
            
            // Si no hay token, denegar acceso
            if token.is_none() {
                return Err(actix_web::error::ErrorUnauthorized("No authentication token"));
            }
            
            // Obtener configuración para verificar el token
            let settings = match req.app_data::<web::Data<Settings>>() {
                Some(settings) => settings,
                None => {
                    error!("No se pudo obtener la configuración de la aplicación");
                    return Err(actix_web::error::ErrorInternalServerError("Internal server error"));
                }
            };
            
            // Verificar token
            match jwt::validate_token(token.as_ref().unwrap(), &settings.jwt_secret) {
                Ok(claims) => {
                    // Token válido, añadir información del usuario a la solicitud
                    req.extensions_mut().insert(claims);
                    service.call(req).await
                },
                Err(e) => {
                    debug!("Token inválido: {}", e);
                    Err(actix_web::error::ErrorUnauthorized("Invalid or expired token"))
                }
            }
        })
    }
}