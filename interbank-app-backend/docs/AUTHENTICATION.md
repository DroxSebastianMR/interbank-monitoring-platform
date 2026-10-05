# Autenticación de la aplicación simulada

## Alcance

Esta implementación reproduce el comportamiento general de una aplicación móvil
bancaria para fines académicos. No consume endpoints privados de Interbank ni
debe utilizar credenciales bancarias reales.

La documentación pública vigente de Interbank indica que el primer ingreso a la
aplicación solicita número de documento, Usuario Digital y contraseña. En los
siguientes ingresos, el dispositivo puede utilizar contraseña, huella o Face ID.
El correo registrado participa en activación y recuperación. Para el alcance
actual del proyecto se utiliza el contrato solicitado: DNI, correo y contraseña.

Fuente funcional:
<https://interbank.pe/canales-digitales/usuario-digital>

## Flujos

### Primer ingreso

`POST /auth/login`

```json
{
  "documentNumber": "12345678",
  "email": "demo@interbank.test",
  "password": "DemoSecure123!",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "deviceName": "Android de pruebas"
}
```

El backend normaliza el correo, busca un usuario activo por DNI y correo,
compara el hash bcrypt, registra el último acceso, emite un JWT corto y crea una
sesión de dispositivo.

### Ingreso desde dispositivo registrado

`POST /auth/device-login`

```json
{
  "sessionToken": "token-opaco-guardado-por-la-aplicacion",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "password": "DemoSecure123!"
}
```

El cliente móvil guarda `sessionToken` en Keychain/Keystore, nunca en texto plano
ni en almacenamiento web ordinario. El backend recupera la sesión desde Redis,
exige que `deviceId` coincida, verifica una prueba criptográfica de la contraseña
y rota el token. Este camino no consulta PostgreSQL ni ejecuta bcrypt en cada
ingreso desde el dispositivo registrado.

La prueba se calcula con HMAC-SHA-256 usando `AUTH_SESSION_PEPPER`, el usuario,
el dispositivo y la contraseña. La contraseña nunca se guarda. Si no se define
un pepper separado, desarrollo reutiliza temporalmente `JWT_SECRET`; producción
debe configurar secretos diferentes.

## Seguridad

- La contraseña nunca se guarda en caché ni se devuelve al cliente.
- PostgreSQL almacena solamente hashes bcrypt con costo 12.
- La caché recibe el hash SHA-256 del token de sesión, no el token original.
- El JWT vence a los 15 minutos por defecto.
- La sesión del dispositivo vence a los 30 días por defecto y se rota en cada acceso.
- DNI y correo se devuelven enmascarados.
- Los errores no revelan si falló DNI, correo, contraseña o sesión.
- El contrato HTTP devuelve el código estable `AUTH_INVALID_CREDENTIALS`; las
  causas internas están tipadas en `LoginFailureReason` y solo se usan en pruebas,
  auditoría u observabilidad segura.
- Los endpoints de login están limitados a cinco intentos por minuto.
- Desarrollo puede usar caché en memoria; los contenedores usan Redis para
  compartir sesiones entre instancias.
- Un cambio de contraseña o bloqueo de usuario debe revocar sus sesiones Redis.
  Esa invalidación formará parte del caso de uso que administre credenciales; no
  se reemplaza por una consulta SQL en cada login rápido.

La respuesta genérica y la comparación de tiempos siguen la guía de
[autenticación de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).
La rotación e invalidación siguen su guía de
[gestión de sesiones](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

## Preparación de base de datos

La migración está versionada y fue aplicada al ambiente Supabase. Para comprobar
o desplegar el mismo estado en otro ambiente:

```powershell
pnpm prisma:migrate
pnpm prisma:seed
```

`pnpm prisma migrate status` comprueba si la base y las migraciones versionadas
están sincronizadas sin crear una migración nueva.

El seed crea exclusivamente un usuario académico:

- DNI: `12345678`
- Correo: `demo@interbank.test`
- Contraseña: `DemoSecure123!`

Estas credenciales nunca deben reutilizarse en producción.
