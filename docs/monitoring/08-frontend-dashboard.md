# Pantallas conectadas

Se conservan React/Vite/Tailwind, layout, cliente Axios, autenticación y React Query. No se reconstruye el diseño de los compañeros.

- Endpoints: inventario y filtros existentes + p50/p95/p99, deltas, conexión real en cabecera.
- Incidentes: reemplaza placeholder, GET /incidents, búsqueda local, paginación20 sobre últimos100, severidad/estado, referencia/resolución.
- Alertas: GET /alerts, mismos componentes y estados; distingue historial de envío push.
- Analítica: GET /analytics/banking con analytics.read **y** transactions.read; totales persistidos, éxito, día anterior, horas/categorías/resultado y fecha PET. No consulta cuando faltan permisos. API caída/configuración incompleta muestra error, no ceros.
- Overview/servicios/health/asistente conservados.

Las transferencias cuentan una vez; Plin se clasifica por relación única. Pagos se cuentan desde ServicePayment. No se suman asientos contables ni HTTP. Rechazos que nunca se persistieron no pueden reconstruirse. No hay volumen por instancia si no fue registrado.

Pendiente: vistas dedicadas de instancias/recursos, control de tráfico, predicciones, configuración avanzada/reportes, CSV/PDF, bandeja de notificaciones. Verificación visual interactiva no realizada; pruebas DOM y build no equivalen a revisión visual en todos los dispositivos.
