# Transferencias internas del banco simulado

## Referencia funcional

Interbank describe transferencias entre cuentas propias y hacia cuentas de terceros,
con elección de moneda, monto, origen y destino. Referencias públicas consultadas
el 5 de octubre de 2026:

- [Entre cuentas Interbank](https://interbank.pe/entre-cuenta-mismo-banco).
- [Flujo en Interbank App](https://interbank.pe/web/guest/centro-de-ayuda/banca-digital/como-puedo-realizar-transferencias-entre-mis-cuentas-interbank-desde-interbank-app).
- [Elección de cuenta y modalidad](https://interbank.pe/es/blog/interbank-para-mi/como-hacer-una-transferencia-interbancaria).

Esta implementación es una simulación de transferencias inmediatas dentro del
mismo banco. No procesa dinero real, transferencias hacia otros bancos, cambio de
moneda, OTP bancario ni comisiones/ITF. No reproduce APIs privadas ni límites
comerciales/regulatorios de Interbank. Un retiro de CTS o un depósito a plazo
necesita un flujo propio; se conserva la política del módulo Accounts.

## Flujo móvil y API

Los endpoints funcionales requieren JWT. `GET /transfers/health` sigue público.

| Método | Endpoint                           | Uso                                                                                               |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| GET    | `/transfers/sources?currency=PEN`  | Seleccionar una cuenta propia activa que permita débitos; incluye saldo decimal actual y producto |
| POST   | `/transfers/beneficiaries/resolve` | Buscar por número de cuenta exacto, confirmar destinatario y obtener su ID/moneda                 |
| POST   | `/transfers`                       | Confirmar monto, cuenta origen y cuenta destino con idempotencia                                  |
| GET    | `/transfers`                       | Historial enviado/recibido con filtros y cursor                                                   |
| GET    | `/transfers/:id`                   | Consultar la constancia si el usuario participa                                                   |

La búsqueda recibe `{"accountNumber":"2003000000002"}`. Espacios y guiones se
normalizan; se aceptan 10 a 20 dígitos, nunca búsqueda por prefijo. Usa el índice
único de `accounts.accountNumber`. La respuesta contiene UUID, número enmascarado,
moneda, producto, nombre y primera letra del apellido del beneficiario y clase
`OWN_ACCOUNTS`/`THIRD_PARTY`. No devuelve saldo, DNI, correo, CCI, ID del titular ni
apodo privado de la cuenta de un tercero. Una cuenta ausente, bloqueada o no
transaccional responde el mismo `DESTINATION_NOT_FOUND`. La búsqueda tiene un
límite local del simulador de 12 solicitudes por minuto mediante Throttler.

El cliente compara el monto con `availableBalance` de la cuenta seleccionada para
dar respuesta inmediata. El backend vuelve a validar el saldo; nunca confía en
esa comprobación del cliente ni en saldos cacheados.

Ejemplo de confirmación:

```http
POST /transfers
Authorization: Bearer <accessToken>
Idempotency-Key: 4df58fbc-6ca3-47d7-9c4b-52316d08c5a0
Content-Type: application/json

{
  "fromAccountId": "00000000-0000-4000-8000-000000000001",
  "toAccountId": "00000000-0000-4000-8000-000000000003",
  "amount": 25.50,
  "currency": "PEN",
  "description": "Transferencia de prueba"
}
```

`currency` es opcional para conservar el cuerpo previo; si se indica debe coincidir
con ambas cuentas. `description` es opcional y admite hasta 160 caracteres.
La respuesta conserva `id`, `status`, `fromAccountId`, `toAccountId`, `amount`,
`currency`, `createdAt`, `completedAt`, y añade número de operación, clase,
origen/destino enmascarados, `isSender`, `isRecipient` y `replayed`.
Los importes de respuesta son strings decimales. Solo se exponen nombres/apodos
de cuentas propias; los terceros se muestran como cuenta de origen/destino.

**Cambio obligatorio para clientes:** `POST /transfers` requiere
`Idempotency-Key`. Generar una clave por intención del usuario y conservarla con
el mismo cuerpo si se pierde la respuesta, hay timeout o un error reintentable.
No generar otra clave automáticamente para reintentar una operación incierta.
El formato es 8–80 caracteres alfanuméricos, guiones o guiones bajos; un UUID es
válido. El header también está permitido en CORS.

El historial admite `currency`, `kind`, `direction` (`OUTGOING`/`INCOMING`),
`accountId` propio, `from`, `to`, `cursor` y `limit` (20 por defecto, máximo 50).
Usa `createdAt DESC, id DESC`, con índices para iniciador y ambas cuentas.
Las fechas ISO son inclusivas; una fecha sin hora equivale a medianoche UTC.
Mantener filtros entre páginas. El cursor debe pertenecer a una transferencia en
la que participa el usuario. Devuelve `items`, `nextCursor` y `hasMore`.
Una transferencia entre cuentas propias puede aparecer tanto en filtros de
enviadas como recibidas; no se duplica dentro de una página.

## Reglas de negocio y consistencia

- El origen pertenece al `sub` del JWT; ambas cuentas deben existir y ser distintas.
- Ambas están `ACTIVE` y sus productos permiten operaciones transaccionales.
- Origen, destino y moneda solicitada coinciden; no hay conversión implícita.
- El monto es positivo, finito, de máximo dos decimales. El máximo técnico
  `999999999999.99` corresponde a `Decimal(14,2)`, no a un límite bancario real.
- El saldo del origen cubre el monto y el destino tiene capacidad decimal para
  recibirlo. Se usan `Prisma.Decimal`, no cálculos monetarios con floats.
- Un débito, un crédito, una transferencia y dos movimientos se confirman en la
  misma transacción. Cualquier fallo revierte todo.
- La clave por usuario y la huella SHA-256 del cuerpo impiden débitos duplicados.
  Repetir la misma clave/cuerpo devuelve la constancia con `replayed: true`;
  reutilizarla con otro cuerpo responde `409 IDEMPOTENCY_CONFLICT`.

El repositorio consulta primero la clave y después el origen. Saldo insuficiente,
origen no autorizado o cuenta inhabilitada se rechazan antes de abrir una
transacción de escritura. Si el saldo parece insuficiente, se vuelve a comprobar
la clave para reconocer una transferencia que pudo confirmarse durante la lectura.

Dentro de la transacción se bloquean las filas de las dos cuentas con
`ORDER BY id FOR UPDATE`, siempre en el mismo orden. Después se vuelve a comprobar
la clave, pertenencia, moneda, disponibilidad y saldo. Esto evita sobregiros con
lecturas previas obsoletas y reduce deadlocks entre transferencias opuestas.
Las actualizaciones de saldo tienen además condiciones de estado, producto y
capacidad. `ReadCommitted` se usa con bloqueos explícitos de filas; no se depende
del precheck para garantizar consistencia.

La espera de bloqueo está acotada a 1500 ms; la transacción a 5000 ms y la espera
por una conexión a 2000 ms. Conflictos/deadlocks/timeouts reconocidos se expresan
como `TRANSFER_BUSY` (503), reintentable con la misma clave. Estos son límites de
trabajo del simulador, no mediciones ni garantías de latencia de Supabase.
Los modos de simulación de fallos siguen funcionando.

Después de confirmar se invalidan los menús de remitente y destinatario. Un fallo
de caché se registra y no convierte una transferencia confirmada en un fallo
financiero; la caché del menú conserva su TTL de 15 segundos. Los saldos usados
para ejecutar transferencias siempre vienen de PostgreSQL.

## Persistencia y arquitectura

Se amplía la tabla existente `transfers` para evitar duplicar el dominio: titular
iniciador, enum `TransferKind`, número de operación único, clave y huella. La FK
compuesta `(sourceAccountId,userId)` exige que el iniciador sea dueño del origen.
Se conservan Accounts y Transaction como fuentes de saldos y movimientos.

La DB exige saldos no negativos, monto positivo, cuentas distintas, operación
única y clave única por usuario. `(transferId,direction)` impide dos débitos o
créditos para una misma transferencia; los movimientos no asociados a
transferencias conservan su comportamiento.

La migración `20261005190000_transfer_execution_contract` es transaccional y
preserva saldos, movimientos e IDs existentes. Determina la clase a partir de los
titulares, asigna el iniciador del origen y crea claves `legacy:<UUID>` y números
de operación a partir del UUID completo. Esas claves históricas no se aceptan como
claves de una nueva solicitud. La migración falla si hay saldos negativos,
transferencias no positivas, cuentas idénticas o movimientos duplicados; resolver
esos datos antes del despliegue, sin borrarlos automáticamente.

El controller traduce HTTP/Swagger; `TransfersService` ejecuta casos de uso y
coordina caché; `TransferQueryService` gestiona búsqueda, selección e historial.
Los repositories separan escritura y lectura. `TransferPolicy` centraliza las
reglas y la normalización; `TransferMapper` serializa respuestas explícitas.
`TransferFailureReason`, `TransferDirection` y `TransferKind` reemplazan cadenas
dispersas. Las excepciones de dominio pasan por una factory, siguiendo Auth y
Service Payments. `TransactionStatus`, `TransactionType`, `Currency` y dirección
del movimiento se reutilizan desde Prisma. Los imports internos usan `@/`.

## Errores

| HTTP | Código                                                                                                                                                                                                                |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400  | `INVALID_AMOUNT`, `INVALID_IDEMPOTENCY_KEY`, `SAME_ACCOUNT`, `CURRENCY_MISMATCH`, `INSUFFICIENT_FUNDS`, `ACCOUNT_UNAVAILABLE`, `DESTINATION_LIMIT_EXCEEDED`, `INVALID_TRANSFER_CURSOR`, `INVALID_TRANSFER_DATE_RANGE` |
| 400  | `VALIDATION_ERROR` para DTO inválido                                                                                                                                                                                  |
| 401  | JWT ausente, inválido o vencido                                                                                                                                                                                       |
| 404  | `SOURCE_NOT_FOUND`, `DESTINATION_NOT_FOUND`, `TRANSFER_NOT_FOUND`                                                                                                                                                     |
| 409  | `IDEMPOTENCY_CONFLICT`                                                                                                                                                                                                |
| 429  | Throttling de solicitudes                                                                                                                                                                                             |
| 503  | `TRANSFER_BUSY`                                                                                                                                                                                                       |

## Verificación y despliegue

```powershell
pnpm test --runInBand
pnpm test:e2e --runInBand
pnpm test:accounts:db
pnpm test:transfers:db
pnpm lint
pnpm build
```

Los tests unitarios cubren saldo exacto, monto inválido, capacidad decimal,
eligibilidad, pertenencia, replays, conflictos, cambios de saldo entre precheck y
bloqueo, timeout y fallo de caché. Los tests HTTP usan el módulo y guard JWT reales
con Prisma aislado y prueban DTO, fuentes, búsqueda, constancias y throttling.

Las pruebas PGlite ejecutan todas las migraciones en PostgreSQL en memoria y
verifican preservación de historia, restricciones, claves, movimientos y rollback.
No leen `.env` ni modifican Supabase. PGlite usa una conexión: estas pruebas no
reemplazan un ensayo concurrente con varias conexiones en un entorno dedicado.
No se declara un resultado de rendimiento real a partir de mocks.

Después de aprobar el despliegue de la migración:

```powershell
pnpm prisma:migrate
pnpm prisma:generate
pnpm build
pnpm start:dev
```

No es necesario ejecutar el seed. Los clientes deben enviar `Idempotency-Key`
antes de usar la nueva versión de `POST /transfers`.
