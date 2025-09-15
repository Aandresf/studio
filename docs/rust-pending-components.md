# Componentes Pendientes de Migración y Optimización

Este documento detalla los componentes y funcionalidades que aún están pendientes de migración completa o requieren optimizaciones adicionales en el backend de Rust.

## Rutas API con Integración Pendiente

### Snapshots de Inventario
- **Archivo**: `src-backend-rust/src/routes/snapshots.rs`
- **Estado**: Estructura base implementada, pendiente integración completa
- **Pendiente**:
  - Implementar la creación de snapshots completos del inventario
  - Desarrollar funcionalidad para comparar snapshots en diferentes fechas
  - Añadir exportación de snapshots a Excel
  - Implementar restauración parcial o completa desde snapshots

### Roles y Permisos Avanzados
- **Archivo**: `src-backend-rust/src/routes/role_permissions.rs`
- **Estado**: Estructura base implementada, pendiente integración completa
- **Pendiente**:
  - Desarrollar un sistema granular de permisos por recurso y acción
  - Implementar roles personalizables con permisos específicos
  - Añadir validación de permisos en todas las rutas API
  - Implementar herencia de permisos entre roles

## Modelos Pendientes de Implementación

### Modelo de Snapshot
- **Archivo**: `src-backend-rust/src/models/snapshot.rs` (por crear)
- **Estado**: Pendiente de implementación
- **Funcionalidad**:
  - Estructura para almacenar snapshots completos de inventario
  - Métodos para crear, obtener y comparar snapshots
  - Funciones para exportar snapshots a diferentes formatos

### Modelo de Permisos
- **Archivo**: `src-backend-rust/src/models/permission.rs` (por crear)
- **Estado**: Pendiente de implementación
- **Funcionalidad**:
  - Definición de permisos específicos por recurso y acción
  - Asignación de permisos a roles
  - Validación de permisos para usuarios y roles

## Funcionalidades Avanzadas Pendientes

### WebSockets para Notificaciones en Tiempo Real
- **Archivos**: 
  - `src-backend-rust/src/websocket_server.rs` (por crear)
  - `src-backend-rust/src/models/notification.rs` (por crear)
- **Estado**: No iniciado
- **Funcionalidad**:
  - Implementar servidor WebSocket con Actix-Web
  - Desarrollar sistema de notificaciones para cambios en inventario
  - Notificaciones para ventas, compras y otros eventos importantes
  - Implementar canales de notificación por tipo de evento

### Sincronización entre Múltiples Instancias
- **Archivos**:
  - `src-backend-rust/src/sync_manager.rs` (por crear)
  - `src-backend-rust/src/models/sync_log.rs` (por crear)
- **Estado**: No iniciado
- **Funcionalidad**:
  - Sistema para sincronizar datos entre múltiples instancias/tiendas
  - Resolución de conflictos en datos
  - Registro detallado de cambios y sincronizaciones
  - Mecanismos de reintento para sincronizaciones fallidas

### Sistema de Alertas
- **Archivos**:
  - `src-backend-rust/src/models/alert.rs` (por crear)
  - `src-backend-rust/src/routes/alerts.rs` (por crear)
- **Estado**: No iniciado
- **Funcionalidad**:
  - Alertas por stock bajo o agotado
  - Alertas por productos sin movimiento
  - Alertas por variaciones importantes en ventas
  - Notificaciones programadas para usuarios específicos

## Optimizaciones Pendientes

### Optimización de Base de Datos
- **Estado**: Pendiente
- **Mejoras**:
  - Revisión y optimización de índices en todas las tablas
  - Implementación de vistas materializadas para consultas frecuentes
  - Optimización de consultas complejas (estadísticas, reportes)
  - Implementación de particionado para tablas grandes (movimientos, ventas)

### Implementación de Caché
- **Archivo**: `src-backend-rust/src/cache_manager.rs` (por crear)
- **Estado**: No iniciado
- **Funcionalidad**:
  - Caché en memoria para consultas frecuentes
  - Invalidación inteligente de caché basada en cambios
  - Caché distribuida para entornos multi-instancia
  - Configuración personalizable de políticas de caché

### Mejoras en Concurrencia
- **Estado**: Pendiente
- **Mejoras**:
  - Optimización del pool de conexiones a base de datos
  - Implementación de bloqueos granulares para operaciones concurrentes
  - Manejo mejorado de transacciones concurrentes
  - Prevención de condiciones de carrera en operaciones críticas

## Plan de Pruebas Pendiente

### Pruebas Unitarias
- **Estado**: No iniciado
- **Cobertura**:
  - Pruebas para todos los modelos y sus métodos
  - Pruebas para rutas API individuales
  - Pruebas para funciones de utilidad
  - Simulación de condiciones de error

### Pruebas de Integración
- **Estado**: No iniciado
- **Cobertura**:
  - Flujos completos de operaciones (ventas, compras, ajustes)
  - Pruebas de autenticación y autorización
  - Escenarios de negocio complejos
  - Pruebas de integración con el frontend

### Pruebas de Rendimiento
- **Estado**: No iniciado
- **Cobertura**:
  - Pruebas de carga con múltiples usuarios concurrentes
  - Evaluación de rendimiento para operaciones críticas
  - Benchmarks comparativos con la versión anterior
  - Pruebas de límites de sistema

## Documentación Pendiente

### Documentación de la API
- **Estado**: Parcial
- **Pendiente**:
  - Documentación completa de todos los endpoints
  - Ejemplos de uso para cada operación
  - Descripción de parámetros y respuestas
  - Guía de errores y códigos de estado

### Guías de Despliegue
- **Estado**: No iniciado
- **Contenido**:
  - Requisitos de sistema
  - Configuración para diferentes entornos (desarrollo, producción)
  - Instrucciones de instalación paso a paso
  - Procedimientos de actualización

### Manual de Mantenimiento
- **Estado**: No iniciado
- **Contenido**:
  - Procedimientos de backup y restauración
  - Monitorización y diagnóstico de problemas
  - Tareas de mantenimiento rutinarias
  - Escalamiento de recursos