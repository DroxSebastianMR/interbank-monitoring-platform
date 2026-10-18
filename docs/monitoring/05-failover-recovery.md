# Control de tráfico y recuperación: pendiente

NGINX conserva su upstream de dos réplicas y checks pasivos existentes. Eso NO implementa aislamiento de una combinación operación+instancia, drenaje por ruta ni recuperación gradual.

No se activaron cambios automáticos, shell remoto, reinicios o reintentos financieros nuevos. No se modificaron bloqueos monetarios ni idempotencia bancaria.

Para completar:

1. Persistir política autorizada, estado deseado/observado/aplicado y versión CAS por operación+instancia.
2. Adaptador NGINX de configuración validada con destinos/rutas de inventario, sin entrada shell; confirmar aplicación y rollback probado.
3. Evaluar alternativa sana, capacidad y fallos compartidos antes de aislar. Nunca aislar la última alternativa sin decisión explícita.
4. Máquina de estados con histéresis, cooldown, máximo de intentos y cancelación por versión obsoleta.
5. Drenaje sin abortar solicitudes en curso; no reintentar POST de pago cuando el resultado es desconocido.
6. Laboratorio aislado para fallos/recuperación y pruebas de no duplicación financiera.

El endpoint nuevo se descubre en modo OBSERVE_ONLY. No se inventa estado aplicado ni recuperación exitosa. Esta fase no está terminada.
