# Evidencia de pruebas — 18 octubre 2026

## Regresión local

- API bancaria: build correcto, ESLint sin errores, Jest27 suites/96 pruebas.
- Monitor: build y ESLint correctos. Suite final y despliegue: ver actualización al final de este archivo.
- Dashboard: build correcto, Vitest9 archivos/24 pruebas; ESLint0 errores,3 warnings preexistentes fast-refresh. Aviso de bundle >500kB permanece.
- IA: pytest27 pruebas al incorporar pipeline; benchmark real detallado en06. Última revalidación en despliegue.

## Integración aislada real

PostgreSQL17 y Redis7.4 temporales, puertos aleatorios loopback, sin volúmenes ni datos de Supabase. Todas las5 migraciones del monitor aplicadas correctamente desde cero.

`monitoring-backend/scripts/test-operational-delivery.mjs`: commit/outbox, worker BullMQ real, destinatarios autorizados, duplicados, rechazo entre usuarios y marcar leído: PASS. Commit→bandeja228.499ms en **una muestra local**, no p95 ni SLA.

`interbank-app-backend/scripts/test-operational-analytics.mjs`: SQL real con fixtures mínimos, timestamp UTC→Lima, Plin sin duplicación y estados pendientes/fallidos: PASS. No equivale a benchmark de millones de filas.

Gateway Socket.IO usa un servidor HTTP real en puerto efímero; sesión/auth se simula para probar origen, permisos, eventos y reconexión. Tests de JWT existentes prueban la guardia por separado. Cliente prueba secuencias, duplicados, reinicios y versión inválida.

No se ejecutaron pagos reales, fallos forzados del stack ni movimientos financieros para benchmarking. No se probó el navegador visualmente. No se afirma100% de cobertura.

## Cierre y despliegue comprobado

- Monitor: Jest28 suites/83 pruebas, build y lint correctos.
- IA:27 pruebas finales; watchdog:3 pruebas.
- Total regresión:230 pruebas (96 API +83 monitor +24 dashboard +27 IA), más3 watchdog y los dos scripts de integración real.
- Cinco imágenes reconstruidas; dos réplicas bancarias, monitor, IA y dashboard recreados tras autorización explícita. NGINX y Prometheus reiniciados; Redis/Grafana/volúmenes conservados.
- Migración aditiva `20261018190000_operational_delivery` aplicada correctamente a Supabase **del monitor**, después de probarla aislada. Ninguna migración bancaria.
- `node --env-file=.env scripts/smoke-monitoring-v2.mjs`: PASS con login y cierre de sesión propios de la prueba. Sin imprimir tokens/datos de clientes.
-156 filas de inventario=78 operaciones por cada una de2 instancias AVAILABLE. Evento WebSocket real `metrics.updated`, schemaVersion1.
- GET snapshot sin autorización401; con autorización200. Incidentes/alertas/notificaciones/analítica200. Analítica confirma fuente PostgreSQL.
- Dashboard5173,health4000,healthNGINX8080 y Prometheus9090:200. NGINX /metrics e /internal/operational-analytics:404.

Rendimiento de smoke (pocas muestras, no SLA): catálogo primera consulta13.04ms;10 repeticiones:81.45,5.77,9.69,7.98,8.24,8.40,7.96,6.40,7.64,7.72ms. Incidentes653.12ms;alertas352.18ms;notificaciones350.94ms;analítica fría2127.22ms (consulta PostgreSQL remota). Caché analítica30s; no se midió percentil poblacional.

Benchmark catálogo in-process500 operaciones/10 consultas agrupadas con upstream simulado25ms: cold46.302ms, caché+serialización1000 repeticiones p50 .439ms/p95 .765ms,payload228420bytes. Esto no es la latencia real HTTP anterior.
