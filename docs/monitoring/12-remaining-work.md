# Trabajo restante priorizado

1. **Control de tráfico y recuperación (alto impacto):** contrato deseado/observado/aplicado, CAS, auditoría, adaptador NGINX validado, rollback y pruebas aisladas por método/ruta/instancia. Aceptación: aislar un endpoint sin afectar otros, sin duplicar pagos y recuperar gradualmente con evidencia.
2. **Alertas/push de empleados:** identidad separada de clientes, tokens, preferencias, receipts, UI bandeja, auditoría de reconocimiento y reintentos fallidos. Aceptación: nunca enviar datos internos a clientes; expiración de tokens y deduplicación probadas.
3. **Workers/outbox:** métricas de retraso/fallos, apagado con timeout, reintento administrativo, archivado, fault-injection Redis/DB. Aceptación: crash entre commit y enqueue no pierde evento; recuperación no duplica efectos.
4. **Observabilidad:** trazas OTel con propagación/sanitización, pool/esperas DB, recursos por instancia, heartbeat separado, métricas del monitor. Aceptación: medir p95 fallo→detección y recuperación real, no confundirms conHz.
5. **ML:** mejorar recall con ventanas/variaciones, recolectar historia observada, backtesting temporal, registro/drift, aprobación de artefactos. Aceptación: umbrales FP/FN acordados antes de promoción. No entrenar con evaluación.
6. **Analítica:** índices globales por fecha revisados con EXPLAIN sobre volumen real, agregación incremental, fallos de negocio persistidos si negocio lo autoriza, exportación segura y comparación a igual hora del día anterior. Hoy no hay atribución por instancia.
7. **UX/verificación:** QA visual/responsive, pruebas del hook Socket.IO/token refresh, pantallas de recursos/configuración/reportes. Conservar identidad y componentes existentes.
8. **Producción:** otro host para watchdog, TLS/secret manager, límites y backup probado, despliegue gradual y pruebas completas sin datos financieros reales.

Ningún pendiente se oculta con controles decorativos ni resultados sintéticos presentados como reales.
