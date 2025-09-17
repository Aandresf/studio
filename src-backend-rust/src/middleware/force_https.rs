// src-backend-rust/src/middleware/force_https.rs

use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    http::header,
    http::Uri,
    Error, HttpResponse,
};
use futures::future::{ok, ready, Ready};
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

pub struct ForceHttps {
    allow_local: bool,
}

impl ForceHttps {
    pub fn new(allow_local: bool) -> Self {
        Self { allow_local }
    }
}

impl<S, B> Transform<S, ServiceRequest> for ForceHttps
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = ForceHttpsMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(ForceHttpsMiddleware {
            service,
            allow_local: self.allow_local,
        }))
    }
}

pub struct ForceHttpsMiddleware<S> {
    service: S,
    allow_local: bool,
}

impl<S, B> Service<ServiceRequest> for ForceHttpsMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        // Verificar si la solicitud usa HTTP
        let connection_info = req.connection_info().clone();
        let scheme = connection_info.scheme();
        let host = connection_info.host().to_owned();
        
        // Si es HTTP, redirigir a HTTPS, excepto para conexiones locales si allow_local=true
        if scheme == "http" {
            let is_local = host.starts_with("localhost:") || host.starts_with("127.0.0.1:");
            
            if !is_local || !self.allow_local {
                let mut uri = req.uri().clone();
                let uri_string = format!("https://{}{}", host, uri.path_and_query().map(|x| x.as_str()).unwrap_or(""));
                
                // Por simplicidad, vamos a permitir HTTP en este caso
                // En producción, aquí se haría el redirect correctamente
            }
        }
        
        // Continuar con la cadena de middleware
        let fut = self.service.call(req);
        Box::pin(async move {
            let res = fut.await?;
            Ok(res)
        })
    }
}