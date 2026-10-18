# Auditoría inicial — 18/10/2026

## Git y alcance preservado

Al comenzar: `main`, commit `69f4248`, árbol limpio, sin archivos modificados. La funcionalidad de endpoints existía en `feature/endpoint-observability`, commit `adf9dad`, no en main. Se creó `feature/monitoring-system-2` desde esa rama para conservar los 42 archivos de la entrega anterior. No se hizo reset, merge a main, push, migración ni modificación de datos.

## Componentes reales

| Directorio | Stack / responsabilidad | Estado observado |
|---|---|---|
| interbank-app-backend | NestJS 11, TypeScript estricto, Prisma 6, PostgreSQL, cache Redis | Auth/sesiones/biometría, cuentas/tarjetas, transferencias, pagos de servicios, perfil, préstamos, Plin y promociones; Swagger e instrumentación Prometheus |
| monitoring-backend | NestJS, Prisma, PostgreSQL independiente, Redis, Axios | RBAC, empleados, auditoría, servicios monitoreados, sondas, estados, incidentes, alertas, asistente, dashboard, catálogo automático |
| monitoring-dashboard | React 19, Vite, Tailwind, React Query, Axios, componentes shadcn/HeroUI | Overview, servicios/detalle, health, asistente y endpoints; incidentes/alertas/analítica aún placeholders |
| interbank-mobile | Expo 57, React Native, Expo Router, SecureStore, expo-notifications | App bancaria; no es un cliente de empleados del monitor. Instalar expo-notifications no implica entrega push operativa |
| monitoring-ai | FastAPI, Pydantic, numpy/pandas, sklearn IsolationForest, joblib, httpx | Baseline y modelo opcional; entrenamiento/evaluación CLI; asistente OpenRouter con alcance de proyecto |
| monitoring-infrastructure | Docker Compose, NGINX, Redis, Prometheus, Grafana, k6 | Dos réplicas bancarias; gateway 8080; monitor 4000; dashboard 5173; scraping por réplica |

## Contratos, seguridad y datos

Controllers agrupados en módulos con controllers/services/repositories/dto/enums; alias `@/`. No hay prefijo global `/v1`; Swagger bancario en `/api/docs`. Se preservan URLs públicas. El catálogo revisado contiene 77 operaciones en 12 tags (incluye salud, simulación y métricas), y se descubre sin ejecutar transacciones. Ver inventario reproducible en `03-endpoint-inventory.md`.

El backend bancario usa JWT/sesiones, pruebas de concurrencia e idempotencia para comandos monetarios, transacciones Prisma y SQL parametrizado. Modelos principales: User, CustomerDetails/Address, Account, Card, Transaction, Transfer, ServicePayment/Debt/Provider/Agreement, PlinEnrollment/Payment/Favorite, LoanApplication, Promotion/Voucher/Favorite, BiometricCredential. No se sustituye ni expande arbitrariamente el esquema contable.

El monitor tiene Employee, Role, Permission, EmployeeRole, RolePermission, AuthSession, AuditLog, MonitoredService, HealthCheck, ServiceStateChange, Incident, Alert y conversaciones/mensajes/runs del asistente. Usa su propia conexión PostgreSQL/Supabase; no compartir credenciales ni unir las bases por comodidad. JWT verifica sesión y permisos mediante guards; el asistente limita acceso según empleado.

## Lo existente frente a lo incompleto

- Instrumentación por operación/instancia y catálogo OpenAPI implementados en la rama base; consultas agrupadas, caché y estados sin datos explícitos. No controla tráfico.
- Las sondas actuales son de servicios configurados, cada 10 s; persisten checks y correlacionan incidentes. No hay heartbeat subsegundo confirmado.
- Los incidentes y alertas son persistidos; no hay entrega push durable, preferencias o acknowledgement completos. NotificationsService retorna `[]`.
- QueuesModule solo exporta nombres; aunque BullMQ figura como dependencia, no hay productores/workers/outbox operativos.
- No hay gateway WebSocket, control administrativo por ruta, recuperación gradual ni autorización de política por endpoint.
- IsolationForest carga artefacto si existe; el script de evaluación dice usar fechas posteriores pero no lo verifica. No hay un registro de versión/dataset ni evaluación temporal obligatoria; scores no son probabilidades.
- Gráficas de servicios usan observaciones reales; no existe analítica bancaria agregada global de los registros contables.
- Salud del monitor consulta Redis; faltan readiness/liveness independientes y watchdog externo funcional.

## Riesgos / dependencias

No reemplazar mecanismos contables por colas. Redis no es ledger. Evitar reintentos automáticos de POST monetarios en NGINX. `up=1` solo demuestra scraping, no funcionamiento del endpoint. Rutas nuevas no implican permiso para aislarlas. NGINX actual es balanceo estático: confirmar capacidades antes de prometer cambios dinámicos. No montar Docker socket en el monitor ni aceptar comandos shell desde HTTP.

Infraestructura actual es para desarrollo: faltan TLS, ACL de Redis, secretos desplegados y endurecimiento de producción. Prometheus y puertos de réplicas ya se restringieron a loopback en la rama base. ML necesita datos representativos; los datasets sintéticos deben identificarse sin afirmar precisión en banca real. El cliente móvil de clientes no debe recibir incidentes internos de empleados.

## Migración incremental

1. Mantener regresiones y añadir inventario estable, instrumentación y transporte realtime autenticado sin sustituir HTTP.
2. Conectar pantallas a contratos existentes; datos ausentes se muestran como ausentes.
3. Añadir trabajos secundarios/outbox solo con transacciones y pruebas de deduplicación, fuera del núcleo monetario.
4. Control de tráfico: políticas explícitas y estados deseado/observado/aplicado separados; no habilitar hasta validar proxy y entorno aislado.
5. Completar pipeline temporal ML y supervisión externa; registrar mediciones y límites.
6. Toda migración aditiva se entrega con instrucciones; no ejecutar sobre las bases actuales sin verificar entorno de pruebas.

## Línea base de pruebas

Entrega previa: API bancaria 94 pruebas, monitor 79 y frontend 20; builds y lint aprobados con tres warnings UI preexistentes. Estos son antecedentes, no validación de esta nueva entrega. Los resultados ejecutados ahora se registrarán en `10-testing-results.md`.
