# Arquitectura móvil

## Entrada y composición

`App.tsx` importa NativeWind, monta los providers globales y protege la aplicación con un error boundary. `AppShell` decide qué árbol mostrar según conectividad y disponibilidad del backend.

## Autenticación

El primer ingreso recopila DNI, correo y contraseña. El dispositivo genera un identificador estable que se guarda con Secure Store. La API devuelve un access token y un session token; ambos se almacenan fuera de AsyncStorage. El access token se incorpora automáticamente en Axios.

El contrato corresponde a:

- `POST /auth/login`
- `POST /auth/device-login` para la autenticación posterior que se implementará en la siguiente etapa visual

## Home bancario

`GET /home` alimenta saldos por moneda, cuentas, accesos rápidos y últimos movimientos. Los importes llegan como strings para no perder precisión decimal.

## Navegación

- `RootNavigator`: autenticación frente a sesión iniciada.
- `TabNavigator`: inicio, cuentas, QR, pagos y perfil.
- Cada dominio puede incorporar su propio stack sin acoplar pantallas entre módulos.

## Seguridad

- No se guardan secretos en el repositorio.
- Solo las variables `EXPO_PUBLIC_*` pueden llegar al bundle; nunca deben contener claves privadas.
- Tokens y sesión se guardan con Expo Secure Store.
- El backend sigue siendo responsable de autorización, idempotencia y validaciones financieras.

## Próxima integración

La base ya conoce los contratos de autenticación y home. Las siguientes iteraciones conectarán cuentas, transferencias, pagos de servicios y QR mediante servicios separados dentro de `infrastructure/api`, manteniendo los casos de uso en `domain`.
