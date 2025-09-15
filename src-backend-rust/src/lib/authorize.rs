// src-backend-rust/src/lib/authorize.rs

use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage,
};
use futures::future::{ready, LocalBoxFuture, Ready};
use std::rc::Rc;

pub struct Authorize {
    permission: String,
}

impl Authorize {
    pub fn new(permission: &str) -> Self {
        Self {
            permission: permission.to_string(),
        }
    }
}

impl<S, B> Transform<S, ServiceRequest> for Authorize
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = AuthorizeMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthorizeMiddleware {
            service,
            permission: self.permission.clone(),
        }))
    }
}

pub struct AuthorizeMiddleware<S> {
    service: S,
    permission: String,
}

impl<S, B> Service<ServiceRequest> for AuthorizeMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        // Verificar si el usuario tiene el permiso requerido
        // Esto es solo un esquema, necesitarías implementar la lógica real
        
        // Por ahora, vamos a suponer que el usuario está en el request extension
        let permission = self.permission.clone();
        let (req, payload) = req.into_parts();
        
        // Aquí deberías recuperar el usuario de req.extensions() y verificar permisos
        // Por ahora, simplemente aprobamos la solicitud
        
        let service = self.service.clone();
        Box::pin(async move {
            // Reconstruir ServiceRequest
            let req = ServiceRequest::from_parts(req, payload).unwrap();
            // Llamar al siguiente middleware/handler
            service.call(req).await
        })
    }
}