# Despliegue seguro

La actualización usa el mismo Compose base que el stack existente. No elimina volúmenes, no cambia credenciales de bases, no migra la base bancaria ni añade acceso de empleados a la app móvil.

Nuevos valores locales (nunca en Git):

- BANK_ANALYTICS_TOKEN: secreto independiente aleatorio >=32 caracteres; compartido solamente por app y monitor.
- BANK_ANALYTICS_URL: en Docker `http://app-backend-1:3000`; interno, sin parámetros de usuario. NGINX deniega /internal/.
- MONITORING_DELIVERY_ENABLED: false por defecto; true solo tras migración del monitor.

Orden desde monitoring-infrastructure:

```powershell
docker compose build app-backend-1 app-backend-2 monitoring-backend monitoring-dashboard monitoring-ai
docker compose run --rm --no-deps monitoring-backend pnpm prisma migrate deploy
docker compose up -d --no-build
docker compose restart nginx prometheus
docker compose ps
```

No ejecutar `down -v`, reset o db push contra Supabase. Conservar backup gestionado de Supabase. La migración crea dos tablas y sus índices; no elimina ni altera tablas bancarias.

Watchdog: ejecutar `monitoring-infrastructure/watchdog/watchdog.py` en otro host/supervisor. WATCHDOG_TARGET_URL apunta a /health; WEBHOOK HTTPS opcional, interval5s,3 fallos para alerta/2 éxitos para recuperación. Sin DB/Redis, sin comandos remotos, sin redirects. Si corre en el mismo host NO protege de la caída del host. No se despliega automáticamente a un servidor externo inexistente.

Pendientes de producción: TLS, gestor de secretos, imágenes fijadas por digest, límites de recursos, monitoreo worker, pruebas de escalado, rollback NGINX y políticas de retención. Docker local actualizado no implica plataforma certificada para banca real.

## Estado local verificado

El18-10-2026 se generó un token interno nuevo en `.env` ignorado por Git y se habilitó la bandeja tras migración exitosa. El stack quedó actualizado y se comprobó mediante scripts. No compartas ese `.env` por repositorio. Tus compañeros deben generar sus propios secretos y aplicar migraciones antes de activar entrega. La app sigue usando su PostgreSQL separado.
