# Flujo de pruebas en Swagger

Esta guía permite cargar los datos de demostración y probar el backend completo en un orden
repetible. El proyecto es una simulación académica: las cuentas, tarjetas, saldos y pagos no
representan productos financieros reales.

## 1. Preparar la base de datos

Ejecute los comandos desde una terminal ubicada en `interbank-app-backend`:

```powershell
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm prisma:seed:verify
```

`prisma:seed:verify` consulta PostgreSQL y muestra el usuario, sus cuentas, tarjetas, deudas y
conteos del catálogo. El seed usa `upsert`, por lo que puede volver a ejecutarse sin duplicar los
registros principales.

Después inicie la API:

```powershell
pnpm start:dev
```

Abra:

- Swagger UI: `http://localhost:3000/api/docs`
- Contrato OpenAPI JSON: `http://localhost:3000/api/docs-json`

## 2. Datos creados por el seed

### Usuario demo

| Campo      | Valor                 |
| ---------- | --------------------- |
| DNI        | `12345678`            |
| Correo     | `demo@interbank.test` |
| Contraseña | `DemoSecure123!`      |

Estas credenciales son exclusivamente locales/de demostración y no deben reutilizarse en un
entorno productivo.

### Cuentas

| Producto              | ID                                     | Moneda | Saldo inicial | Número          | CCI simulado           |
| --------------------- | -------------------------------------- | ------ | ------------: | --------------- | ---------------------- |
| Cuenta Simple Soles   | `00000000-0000-4000-8000-000000000001` | PEN    |   S/ 4,250.50 | `2003000000001` | `00319593819480932388` |
| Cuenta Simple Dólares | `00000000-0000-4000-8000-000000000002` | USD    |    US$ 850.75 | `2003000000002` | `00343157027467628446` |
| Cuenta Ahorro Meta    | `00000000-0000-4000-8000-000000000003` | PEN    |     S/ 300.00 | `2003000000003` | `00329531170165347552` |

### Tarjetas

| Producto            | ID                                     | Tipo   | Formato  | Red  | Terminación | Estado |
| ------------------- | -------------------------------------- | ------ | -------- | ---- | ----------- | ------ |
| Débito Digital Demo | `70000000-0000-4000-8000-000000000001` | DEBIT  | DIGITAL  | VISA | `1234`      | ACTIVE |
| Crédito Visa Demo   | `70000000-0000-4000-8000-000000000002` | CREDIT | PHYSICAL | VISA | `5678`      | ACTIVE |

La tarjeta débito está vinculada a las cuentas Simple Soles y Simple Dólares. La tarjeta de
crédito tiene líneas independientes en PEN y USD.

## 3. Autenticarse en Swagger

### 3.1 Primer ingreso: `POST /auth/login`

Seleccione **Try it out**, copie este cuerpo y ejecute:

```json
{
  "documentNumber": "12345678",
  "email": "demo@interbank.test",
  "password": "DemoSecure123!",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "deviceName": "Swagger QA"
}
```

Guarde estos dos valores de la respuesta:

- `token.accessToken`: autoriza los endpoints privados.
- `session.sessionToken`: permite probar el posterior ingreso del mismo dispositivo.

Pulse **Authorize** en la parte superior de Swagger y pegue solamente el valor de
`token.accessToken`, sin comillas y sin escribir manualmente `Bearer`. Swagger añade el esquema.

### 3.2 Ingreso posterior: `POST /auth/device-login`

Use el `sessionToken` retornado por el login anterior:

```json
{
  "sessionToken": "PEGAR_SESSION_TOKEN_AQUI",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "password": "DemoSecure123!"
}
```

La respuesta debe indicar `loginMode: "DEVICE_LOGIN"` y entregar un access token nuevo.

## 4. Orden recomendado de prueba

### 4.1 Salud y simulación

1. `GET /health`
2. `GET /auth/health`
3. `GET /accounts/health`
4. `GET /transfers/health`
5. `GET /simulation`

En desarrollo puede cambiar temporalmente el comportamiento de un servicio mediante
`POST /simulation/{service}/mode`:

```json
{
  "mode": "SLOW"
}
```

Los modos disponibles son `NORMAL`, `SLOW`, `ERROR`, `TIMEOUT` y `DOWN`. Al terminar una prueba,
devuelva siempre el servicio a `NORMAL`.

### 4.2 Menú principal

Ejecute `GET /home`. Debe retornar:

- resumen de saldos PEN y USD;
- las tres cuentas del usuario;
- accesos rápidos de transferencias y pagos;
- movimientos recientes.

### 4.3 Cuentas y tarjetas

Pruebe en este orden:

1. `GET /accounts?currency=PEN&type=SAVINGS&status=ACTIVE`
2. `GET /accounts/types`
3. `GET /accounts/card-types`
4. `GET /accounts/cards?kind=DEBIT&status=ACTIVE`
5. `GET /accounts/cards/70000000-0000-4000-8000-000000000001`
6. `GET /accounts/00000000-0000-4000-8000-000000000001`
7. `GET /accounts/00000000-0000-4000-8000-000000000001/identifiers`
8. `GET /accounts/00000000-0000-4000-8000-000000000001/cards`
9. `GET /accounts/00000000-0000-4000-8000-000000000001/balance`
10. `GET /accounts/00000000-0000-4000-8000-000000000001/transactions?limit=10`
11. `GET /accounts/00000000-0000-4000-8000-000000000001/statement?limit=10&status=COMPLETED`

Para paginar el estado de cuenta, copie `nextCursor` de una respuesta y envíelo como parámetro
`cursor` en la siguiente solicitud. También se puede filtrar por `type`, `direction`, `status`,
`from` y `to`.

### 4.4 Transferencia entre cuentas en soles

`POST /transfers` modifica saldos y crea los movimientos de débito y crédito de forma atómica:

```json
{
  "fromAccountId": "00000000-0000-4000-8000-000000000001",
  "toAccountId": "00000000-0000-4000-8000-000000000003",
  "amount": 10,
  "description": "Prueba Swagger entre cuentas PEN"
}
```

Después vuelva a consultar `/balance` y `/transactions` de ambas cuentas. No intente transferir
de PEN a USD: el dominio rechaza transferencias entre monedas diferentes.

### 4.5 Catálogo y consulta de deuda

1. `GET /service-payments/categories`
2. `GET /service-payments/providers?category=TELECOMMUNICATIONS&search=entel&limit=20`
3. `POST /service-payments/debts/inquiry`:

```json
{
  "serviceCode": "ENTEL_POSTPAGO",
  "customerReference": "977666555"
}
```

El seed deja este recibo pendiente:

- deuda: `40000000-0000-4000-8000-000000000005`;
- importe: S/ 69.90;
- moneda: PEN.

### 4.6 Pago frecuente

Ejecute `POST /service-payments/saved`:

```json
{
  "serviceCode": "ENTEL_POSTPAGO",
  "customerReference": "977666555",
  "alias": "Mi línea Entel"
}
```

Compruebe el resultado mediante `GET /service-payments/saved`. Para probar la eliminación,
copie el `id` retornado y ejecute `DELETE /service-payments/saved/{id}`; la respuesta correcta es
`204 No Content`.

### 4.7 Pago de servicio e idempotencia

Genere un UUID nuevo para el encabezado `Idempotency-Key`. En PowerShell puede obtenerlo con:

```powershell
[guid]::NewGuid().ToString()
```

En `POST /service-payments`, coloque el UUID en el encabezado y use:

```json
{
  "accountId": "00000000-0000-4000-8000-000000000001",
  "serviceCode": "ENTEL_POSTPAGO",
  "customerReference": "977666555",
  "debtId": "40000000-0000-4000-8000-000000000005"
}
```

Guarde el `id` de la respuesta. Repita exactamente la misma solicitud con la misma
`Idempotency-Key`: debe devolver el pago existente y no generar un segundo débito. Cambiar el
cuerpo manteniendo la misma clave debe producir un conflicto controlado.

Luego pruebe:

1. `GET /service-payments/history?limit=20`
2. `GET /service-payments/{id}` usando el ID de la respuesta anterior.
3. `GET /accounts/00000000-0000-4000-8000-000000000001/balance` para comprobar el débito.

Si el recibo Entel ya fue pagado, puede usar el pendiente alternativo:

| Campo      | Valor                                  |
| ---------- | -------------------------------------- |
| Servicio   | `MOVISTAR_POSTPAGO`                    |
| Referencia | `988777666`                            |
| Deuda      | `40000000-0000-4000-8000-000000000004` |
| Importe    | S/ 79.90                               |

## 5. Pruebas negativas importantes

- Contraseña incorrecta en `/auth/login`: debe retornar `401`.
- Endpoint protegido sin access token: debe retornar `401`.
- UUID mal formado: debe retornar `400`.
- Cuenta que no pertenece al usuario: debe retornar `404` sin filtrar información sensible.
- Transferencia con la misma cuenta como origen y destino: debe rechazarse.
- Transferencia PEN a USD: debe rechazarse por incompatibilidad de moneda.
- Pago PEN usando la cuenta USD: debe rechazarse por incompatibilidad de moneda.
- Saldo insuficiente: debe rechazarse sin crear movimientos parciales.
- Misma `Idempotency-Key` con datos diferentes: debe retornar conflicto y no cobrar.

## 6. Repetir la demostración

`pnpm prisma:seed` restablece los saldos demo y conserva una carga idempotente de catálogos y
usuarios. Un recibo ya pagado no se reabre automáticamente para proteger la consistencia de los
pagos existentes. Use otro recibo pendiente o una nueva fixture para repetir un cobro. No ejecute
`prisma migrate reset` contra la base compartida de Supabase: ese comando elimina todos los datos.
