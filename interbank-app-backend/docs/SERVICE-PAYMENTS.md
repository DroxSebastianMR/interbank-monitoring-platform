# Arquitectura de pago de servicios

## Objetivo

El módulo modela un servicio de recaudación, no una lista fija dentro del código. El catálogo se administra en PostgreSQL y separa el rubro, la empresa recaudadora, el convenio concreto, los recibos consultados y el pago ejecutado.

## Modelo de dominio

```text
ServiceCategory 1──N ServiceProvider 1──N ServiceAgreement
                                             │
                                             ├──N ServiceDebt
                                             ├──N SavedServicePayment
                                             └──N ServicePayment ──1 Transaction
                                                                       │
Account 1───────────────────────────────────────────────────────────────┘
```

- `ServiceCategory`: rubro visible para navegación y filtrado (`UTILITIES`, `TELECOMMUNICATIONS`).
- `ServiceProvider`: empresa afiliada. Conserva código estable, nombre corto, razón social, alias de búsqueda y URL lógica del logotipo.
- `ServiceAgreement`: convenio cobrable de una empresa. Define el tipo, etiqueta, patrón y longitud del código; moneda, comisión, límites y reglas de consulta/pago parcial.
- `ServiceDebt`: recibo pendiente obtenido para un código de cliente o suministro. Guarda importe, emisión, vencimiento y estado.
- `ServicePayment`: constancia durable del pago. Conserva snapshots de empresa/servicio para que el historial no cambie cuando cambie el catálogo.
- `Transaction`: movimiento financiero general de la cuenta. Cada pago completado genera exactamente un débito relacionado mediante `transactionId` único. Una transferencia conserva dos movimientos relacionados mediante `transferId`: débito en origen y crédito en destino.
- `SavedServicePayment`: pago frecuente del usuario, identificado por convenio y referencia.

## Organización del código

El módulo está dividido por responsabilidad. El controlador solo mantiene el contrato HTTP y delega el trabajo; no contiene reglas de negocio ni acceso directo a Prisma.

```text
service-payments/
├── controllers/        Contrato HTTP y documentación Swagger
├── dto/                Validación de entradas
├── enums/              Códigos estables de error del dominio
├── exceptions/         Error de dominio y traducción a errores HTTP
├── mappers/            Conversión de entidades a respuestas públicas
├── policies/           Reglas puras de cálculo y límites de importes
├── repositories/       Acceso a PostgreSQL separado por caso de uso
├── services/           Orquestación de cada capacidad del módulo
├── types/              Contratos internos y tipos de respuesta
└── service-payments.module.ts
```

### Servicios de aplicación

| Servicio                           | Responsabilidad                                               |
| ---------------------------------- | ------------------------------------------------------------- |
| `ServiceCatalogService`            | Categorías, empresas y convenios, con lectura desde caché     |
| `ServiceDebtInquiryService`        | Validación del código de cliente y consulta de recibos        |
| `ServicePaymentExecutionService`   | Idempotencia, ejecución del pago e invalidación de caché      |
| `ServicePaymentQueryService`       | Historial y constancia individual                             |
| `SavedServicePaymentService`       | Alta, consulta y eliminación de pagos frecuentes              |
| `ServiceAgreementResolverService`  | Resolución centralizada de un convenio activo                 |
| `ServiceReferenceValidatorService` | Validación reutilizable de longitud y patrón de la referencia |
| `ServicePaymentsCacheService`      | Claves, lectura, escritura e invalidación de caché del módulo |

### Repositorios

El acceso a datos también está aislado: catálogo, deudas, comandos de pago, consultas de pagos y pagos frecuentes tienen repositorios distintos. `ServicePaymentCommandRepository` conserva la transacción financiera atómica; dividir sus pasos entre repositorios rompería el límite transaccional y aumentaría el riesgo de estados parciales.

Esta reorganización no modifica rutas, cuerpos, respuestas, reglas financieras, tablas ni migraciones. Su objetivo es que cada archivo tenga un motivo de cambio claro y que nuevos casos de uso puedan agregarse sin hacer crecer una clase central.

## Flujo

1. La app carga `GET /service-payments/categories`.
2. Busca empresas con `GET /service-payments/providers?category=UTILITIES&search=luz`.
3. Consulta recibos con `POST /service-payments/debts/inquiry`.
4. El cliente selecciona el recibo y la cuenta de cargo.
5. Envía `POST /service-payments` con un encabezado `Idempotency-Key` nuevo.
6. Una transacción serializable valida convenio, recibo, moneda y saldo; debita la cuenta; marca el recibo pagado; crea el movimiento y la constancia.
7. La respuesta contiene `operationNumber`, datos del servicio, importes, cuenta enmascarada y fecha.

## Endpoints

| Método   | Ruta                              | Responsabilidad                                   |
| -------- | --------------------------------- | ------------------------------------------------- |
| `GET`    | `/service-payments/categories`    | Rubros activos con cantidad de empresas           |
| `GET`    | `/service-payments/providers`     | Catálogo filtrable de empresas y convenios        |
| `POST`   | `/service-payments/debts/inquiry` | Consulta recibos pendientes por convenio y código |
| `POST`   | `/service-payments`               | Ejecuta el pago de forma idempotente              |
| `GET`    | `/service-payments/history`       | Historial del usuario autenticado                 |
| `GET`    | `/service-payments/:id`           | Constancia individual                             |
| `GET`    | `/service-payments/saved`         | Pagos frecuentes                                  |
| `POST`   | `/service-payments/saved`         | Guarda o renombra un pago frecuente               |
| `DELETE` | `/service-payments/saved/:id`     | Elimina un pago frecuente                         |

Todos los endpoints requieren JWT. El endpoint de ejecución también requiere `Idempotency-Key` de 16 a 80 caracteres.

## Integridad y concurrencia

- El débito usa una actualización condicional `balance >= totalAmount`; dos solicitudes concurrentes no pueden gastar el mismo saldo disponible.
- El pago se ejecuta con aislamiento `SERIALIZABLE`.
- La restricción única `(userId, idempotencyKey)` evita cobros duplicados entre las dos instancias del backend.
- Se guarda un hash del cuerpo. Reutilizar la misma clave con datos distintos devuelve conflicto.
- El cambio de deuda `PENDING → PAID`, el movimiento y la constancia ocurren en la misma transacción. Un error revierte todo.
- Los índices cubren catálogo, filtros, consulta de deudas e historial reciente.
- Las respuestas repetidas conservan además una copia de 24 horas en Redis; la restricción de PostgreSQL continúa siendo la garantía definitiva si Redis se reinicia.

## Rendimiento observado

Prueba local del 5 de octubre de 2026 contra Supabase `us-east-1`:

| Operación                            | Tiempo observado |
| ------------------------------------ | ---------------: |
| Health local                         |           2–3 ms |
| Catálogo cacheado                    |           2–5 ms |
| Consulta de deuda cacheada           |           3–4 ms |
| Reintento idempotente cacheado       |            28 ms |
| Conflicto de idempotencia            |             6 ms |
| Primer pago contra PostgreSQL remoto |            6.4 s |

El primer pago prioriza consistencia: realiza validaciones, débito condicionado, cambio de estado, movimiento y constancia dentro de una transacción serializable. Su latencia actual está dominada por los viajes desde el equipo local hacia la región remota. Para un entorno desplegado se debe ubicar el backend en la misma región que PostgreSQL, mantener el pooler transaccional, medir p95/p99 y fijar un SLO antes de aumentar concurrencia. No se debe eliminar validación financiera para maquillar una medición local.

## Catálogo e imágenes

`logoUrl` contiene una ruta lógica como `/assets/service-providers/sedapal.svg`. El frontend debe resolverla contra su CDN o servidor de recursos. Las imágenes no se guardan como binarios en PostgreSQL. Los códigos (`SEDAPAL`, `SEDAPAL_AGUA`) son identificadores técnicos estables; los nombres pueden cambiar sin romper integraciones.

## Datos de demostración

El seed incluye categorías, Luz del Sur, Sedapal, Claro, Movistar y Entel, junto con convenios y cinco recibos de demostración. El seed conserva el estado de un recibo ya pagado: volver a ejecutarlo nunca reabre una deuda. Son datos controlados para desarrollo; integrar una recaudadora real requerirá un adaptador externo, conciliación y manejo asíncrono de estados.

## Criterios utilizados

- El flujo sigue la secuencia pública de Interbank: elegir rubro/servicio, identificar recibo, elegir cuenta, validar y emitir constancia.
- La separación empresa/convenio refleja que las características dependen del convenio firmado con cada empresa recaudadora.
- La idempotencia sigue el patrón utilizado por APIs de pago: una clave de cliente permite repetir una solicitud sin duplicar el cobro.
- La protección concurrente combina actualización condicional de saldo, estado único del recibo y transacción serializable de PostgreSQL.

Referencias: [Pago de servicios en Interbank App](https://interbank.pe/es/canales-digitales/interbank-app/pago-servicios), [ayuda oficial del flujo de pago](https://interbank.pe/web/guest/centro-de-ayuda/banca-digital/como-realizo-pago-de-servicios-desde-interbank-app), [servicios públicos y convenios](https://interbank.pe/web/guest/servicios/pagar-cuentas/pago-servicios-publicos), [idempotencia de APIs de pago](https://docs.stripe.com/api/idempotent_requests) y [aislamiento de transacciones en PostgreSQL](https://www.postgresql.org/docs/current/transaction-iso.html).
