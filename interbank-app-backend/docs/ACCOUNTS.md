# Cuentas, productos y tarjetas

## Alcance y referencias

Este módulo modela la consulta de productos del usuario en el backend bancario
simulado. La referencia funcional son las páginas públicas de Interbank, consultadas
el 5 de octubre de 2026; no se conocen ni reproducen sus contratos internos.

- [Cuentas de ahorro](https://interbank.pe/es/cuentas/cuentas-ahorro/): productos de ahorro.
- [Cuenta Sueldo](https://interbank.pe/cuentas/cuentas-sueldo-cts/cuenta-sueldo): remuneraciones y consulta de cuenta/CCI.
- [Cuenta Súper Tasa](https://interbank.pe/web/guest/cuentas/cuentas-ahorro/cuenta-super-tasa): ahorro en soles o dólares.
- [CCI](https://interbank.pe/web/guest/centro-de-ayuda/envio-y-recepcion-de-dinero/que-es-el-cci): identificador único de 20 dígitos asociado a la cuenta.
- [Tarjeta digital](https://interbank.pe/web/guest/tarjetas/tarjeta-digital/tarjeta-digital): tarjeta de débito y selección de cuentas/monedas.
- [Débito Benefit](https://interbank.pe/tarjetas/tarjeta-debito/visa-debito-benefit): operaciones con cargo a cuentas.

La política que excluye CTS y plazo de los débitos transaccionales es una decisión
del simulador. Sus retiros/aperturas necesitan casos de uso específicos; esta
política no pretende representar la regulación vigente de disposición de CTS.
No se incorporan tasas ni comisiones promocionales al contrato del catálogo.

## Modelo y extensibilidad

| Tabla                  | Responsabilidad                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `account_types`        | Productos de depósito, código estable, nombre, familia, monedas soportadas, orden, disponibilidad comercial y política de débito |
| `accounts`             | Instancia del producto de un usuario, moneda, saldo, número, CCI y estado                                                        |
| `card_types`           | Productos de tarjeta, código estable, clase débito/crédito y red                                                                 |
| `cards`                | Tarjeta del usuario, últimos cuatro dígitos, formato, estado y vencimiento                                                       |
| `account_cards`        | Vínculo de una tarjeta de débito con una o varias cuentas propias                                                                |
| `card_credit_balances` | Límite y deuda de una tarjeta de crédito por moneda                                                                              |

`AccountType` define familias: `SAVINGS`, `CHECKING`, `CTS`, `TERM_DEPOSIT`.
El catálogo permite añadir productos dentro de esas familias sin ampliar el enum
por cada nombre comercial. El catálogo inicial incluye Simple, Sueldo, Súper Tasa,
Corriente, CTS y Plazo. PEN/USD permanecen en el enum compartido `Currency`.

`CardKind` distingue `DEBIT` y `CREDIT`; `CardNetwork` admite Visa, Mastercard y
Amex. `CardFormat` distingue `PHYSICAL` y `DIGITAL`. Los productos del catálogo
inicial son Visa Débito Clásica, Visa Débito Benefit y Visa Crédito Clásica.

Una tarjeta de crédito representa una línea de financiamiento. Su deuda y crédito
disponible se consultan aparte; no se suman al ahorro ni pueden usarse como saldo
de depósito para transferencias/pagos. `availableCredit` se calcula con `Decimal`
y tiene piso cero cuando la deuda supera el límite. Este módulo no liquida consumos,
intereses, cuotas, estados de cuenta ni pagos de tarjetas.

`isActive` controla nuevas ofertas en el catálogo; no bloquea automáticamente las
cuentas o tarjetas existentes. El estado de cada instancia controla su operación.
Las listas de cuentas/tarjetas están acotadas a 100 registros por usuario.

## Arquitectura

El controller se ocupa de HTTP y Swagger. Los services separan consultas de
cuentas, catálogos, tarjetas y movimientos. Los repositories consultan Prisma con
proyecciones tipadas `satisfies Prisma.*Select`; los mappers serializan decimales,
fechas y números enmascarados. Los DTO validan enums, UUID, fechas y límites.
Los errores usan `AccountErrorCode` y una factory, como los módulos auth y pagos.
Los imports internos usan `@/`.

Las consultas se limitan al `sub` del JWT. Un UUID válido que no pertenece al
usuario responde `404`, también al consultar tarjetas o movimientos. Las claves
foráneas compuestas impiden unir una tarjeta con cuentas de otro titular y
desalinear la familia de una cuenta con el producto de catálogo.

La DB también valida CCI numérico único de 20 dígitos, últimos cuatro dígitos,
vínculos solo débito, líneas solo crédito, montos de crédito no negativos y fecha
de cierre coherente con `CLOSED`. No se guardan PAN completo, PIN ni CVV.

Los servicios de pagos y transferencias comprueban `ACTIVE` y `allowsDebits` antes
de operar y en la actualización condicional del saldo. Una transferencia que
encuentra el destino bloqueado revierte el débito dentro de su transacción.
No se cambia el contrato de autenticación ni la caché de sesiones.

## API

Todos los endpoints funcionales requieren `Authorization: Bearer <accessToken>`.
`GET /accounts/health` sigue público para monitoreo.

| GET                          | Respuesta                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `/accounts`                  | Array compatible de cuentas; filtros `currency`, `type`, `status`, `accountTypeId` |
| `/accounts/types`            | Catálogo activo de cuentas                                                         |
| `/accounts/card-types`       | Catálogo activo de tarjetas                                                        |
| `/accounts/cards`            | Tarjetas propias; filtros `kind`, `status`                                         |
| `/accounts/cards/:cardId`    | Detalle de tarjeta propia y saldos de crédito                                      |
| `/accounts/:id`              | Detalle de cuenta propia y producto                                                |
| `/accounts/:id/identifiers`  | Número completo y CCI de la cuenta propia                                          |
| `/accounts/:id/cards`        | Tarjetas de débito vinculadas a la cuenta propia                                   |
| `/accounts/:id/balance`      | Saldo de depósito y disponibilidad operativa `canDebit`                            |
| `/accounts/:id/transactions` | Array compatible de movimientos                                                    |
| `/accounts/:id/statement`    | Página de movimientos con `items`, `nextCursor`, `hasMore`                         |

Los resúmenes enmascaran números; solo `identifiers` devuelve el número y CCI
completos. `balance` conserva el valor del depósito incluso si la cuenta está
bloqueada; `canDebit` indica si admite las operaciones transaccionales del simulador.
Los importes se responden como strings de dos decimales.

Los movimientos admiten `limit` (20 por defecto, máximo 50), `cursor` (UUID del
último movimiento), `type`, `direction`, `status`, `from`, `to`. Las fechas son ISO
8601; el rango es inclusivo, y una fecha sin hora representa medianoche UTC.
Para incluir un día completo, especificar su última hora o el límite temporal
deseado. El orden es `occurredAt DESC, id DESC`; el índice incluye ambos campos.
El cursor se comprueba contra la cuenta propia y se usa como posición temporal,
evitando offsets y saltos por nuevas inserciones. Mantener los mismos filtros
entre páginas. `transactions` conserva un array; `statement` informa continuidad.

Ejemplo:

```http
GET /accounts?currency=PEN&status=ACTIVE
GET /accounts/00000000-0000-4000-8000-000000000001/statement?limit=20&direction=DEBIT
```

## CCI simulado

El CCI es estable para cada cuenta y se almacena en la DB. La migración genera los
identificadores de cuentas existentes y `SimulatedCciPolicy` usa exactamente el
mismo cálculo para el seed: prefijo `003` y 17 dígitos derivados del UUID. El índice
único impide colisiones. No se recalcula ni rota al consultar la cuenta.

Este identificador no implementa el algoritmo ni los dígitos verificadores reales
de Interbank y no sirve para transferencias reales. La respuesta lleva
`isSimulated: true`. Una integración bancaria futura deberá guardar el CCI emitido
por el proveedor, reemplazando la política de generación del simulador.

## Migración y datos demo

Las dos migraciones nuevas primero amplían la familia de productos y después
crean tablas/catálogos, asignan Simple a ahorros y Corriente a cuentas corrientes,
y completan CCI. No modifican saldos, transacciones ni titulares. La segunda
migración es transaccional. Revisar y desplegar antes de arrancar este build contra
una DB que aún tenga el esquema anterior:

```powershell
pnpm prisma migrate status
pnpm prisma:migrate
pnpm prisma:generate
pnpm build
pnpm start:dev
```

El seed de desarrollo añade catálogos, una tarjeta de débito digital vinculada a
las cuentas demo PEN/USD y una Visa de crédito con saldos independientes. Las
nuevas inserciones son idempotentes y no reinician estados/deudas existentes.
El seed general conserva su comportamiento anterior de restablecer saldos de las
cuentas demo; usarlo solo en un ambiente de demostración, no para actualizar una
DB compartida. El despliegue de migraciones no ejecuta ese seed.

## Verificación

```powershell
pnpm test --runInBand
pnpm test:e2e --runInBand
pnpm test:accounts:db
pnpm lint
pnpm build
```

Las pruebas HTTP usan el módulo Accounts real, el guard JWT real y repositorios
aislados mediante Prisma simulado. Validan autenticación, propiedad, rutas,
DTO, serialización y cursores. No sustituyen una prueba de despliegue con Supabase.

`test:accounts:db` ejecuta toda la historia de migraciones en PostgreSQL en memoria
con PGlite, incluyendo cuentas y movimientos del esquema anterior, y verifica
preservación de datos y restricciones. No lee `.env` ni accede a Supabase.
PGlite es una dependencia exclusiva de desarrollo/pruebas.
