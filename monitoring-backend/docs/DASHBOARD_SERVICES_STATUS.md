# Resumen global y servicios digitales: estado de implementación

Fecha: 13 de octubre de 2026. Rama: `feature/dashboard-overview-services`.

## Flujo implementado

El backend bancario ya expone `/auth/health`, `/accounts/health`, `/transfers/health` y `/metrics`. El monitor consulta las tres rutas health del backend bancario configurado, verifica el contenido funcional, aplica las reglas de estado, registra cada sonda y la transición de estado en PostgreSQL y ofrece consultas de lectura al dashboard. La pantalla React se autentica como empleado y consume exclusivamente el Monitoring Backend. Las consultas de resumen, servicios y detalle se actualizan mediante React Query aproximadamente cada 10 segundos.

La migración `20261013110000_operational_services` agrega código único, control de versión, pausa, criticidad, estado persistido, observaciones y transiciones. `prisma/seed.ts` crea los tres servicios iniciales sin sobrescribir configuraciones existentes. Las escrituras administrativas usan los permisos actuales y auditoría. La comprobación manual utiliza un límite de solicitudes y comparte una sonda en curso para evitar duplicados.

## Alcance de datos

| Dato | Fuente actual | Límite |
| --- | --- | --- |
| Estado, disponibilidad y latencia p95 del resumen | Sondas persistidas de la última hora | No representan todas las solicitudes bancarias |
| Incidentes y alertas activos | Tablas existentes del monitor | Requieren base conectada |
| Cambios de estado y configuración | Transiciones y auditoría | No hay historial anterior a la migración |
| Tasa de errores HTTP | No conectada al resumen | Se devuelve `null`, nunca cero supuesto |
| Tráfico y recursos por servicio | Prometheus accesible durante la detección, sin serie histórica para estas vistas | No se simulan valores en el dashboard |
| Salud de instancias individuales | Topología configurada | Se devuelve `NO_DATA`; no se deduce desde NGINX |
| `validate-target` | Validación estricta de ruta relativa `/modulo/health` | No realiza todavía una prueba activa de conectividad |

El modo `start:docs` confirma las 48 operaciones registradas en Swagger, pero responde 503 para las rutas de negocio y **no** prueba persistencia ni integración.

## Verificación ejecutada sin infraestructura

- Esquema Prisma válido con una URL de sintaxis de prueba; migración creada, no aplicada.
- Typecheck y ESLint del Monitoring Backend y del dashboard: correctos.
- Backend: 19 suites, 41 pruebas unitarias correctas. La prueba HTTP `metrics.module.spec` quedó excluida porque el sandbox impide abrir un socket local.
- Dashboard: 1 prueba de componente correcta y build Vite correcto.
- Compilación NestJS y arranque de `main.docs.js`: 48 operaciones documentadas.
- La consulta HTTP a Swagger desde el sandbox fue denegada por permisos de socket, aunque el proceso informó arranque correcto.

## Pendiente para integración real

No hay PostgreSQL/Supabase de prueba ni Docker disponibles. Por tanto, aún no están verificados: aplicación de la migración, seed, autenticación real de empleado, persistencia y lectura tras reinicio, comunicación efectiva con el backend bancario, Redis/Prometheus y escenarios de caída/recuperación. No se consideran completos los objetivos de latencia ni de actualización menor a 15 segundos sin medición.

Cuando exista un entorno de prueba aislado, configurar `.env` locales sin compartir secretos, aplicar `pnpm prisma:migrate`, generar cliente con `pnpm prisma:generate`, ejecutar `pnpm prisma:seed` y levantar backend bancario, monitor y dashboard. Después probar los escenarios normal, degradación, falla de una instancia, indisponibilidad/recuperación y pérdida de telemetría. Nunca aplicar esta migración contra la base de producción sin respaldo y revisión previa.
