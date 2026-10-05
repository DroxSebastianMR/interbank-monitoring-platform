# Menú principal, cuentas y operaciones

## Alcance

Esta vertical modela exclusivamente las capacidades necesarias para demostrar el
sistema bancario supervisado. No consume APIs privadas de Interbank ni ejecuta
operaciones financieras reales.

La experiencia pública de Interbank agrupa transferencias y pago de servicios en
“Operaciones”, muestra saldos y movimientos y permite cuentas en soles o dólares.
La implementación conserva esos conceptos sin intentar clonar elementos visuales
ni contratos internos de la entidad.

Referencias funcionales:

- <https://interbank.pe/interbank-app>
- <https://interbank.pe/es/canales-digitales/interbank-app/pago-servicios>
- <https://interbank.pe/web/guest/centro-de-ayuda/banca-digital/como-puedo-realizar-transferencias-entre-mis-cuentas-interbank-desde-interbank-app>

## Carga inicial

`GET /home` requiere `Authorization: Bearer <accessToken>` y devuelve en una sola
respuesta:

- nombre del usuario;
- totales separados en `PEN` y `USD`;
- cuentas con número enmascarado;
- accesos rápidos que apuntan a endpoints existentes;
- diez movimientos recientes.

Los importes se serializan como strings decimales (`"4250.50"`) para evitar
errores binarios de punto flotante en el cliente móvil.

La respuesta compuesta utiliza una caché de 15 segundos. En desarrollo funciona
en memoria y en las réplicas Docker utiliza el mismo Redis. Transferencias y
pagos invalidan la clave del usuario después de confirmar la transacción, por lo
que el siguiente `GET /home` vuelve a consultar saldos vigentes.

## Paths

La ampliación de cuentas, tipos de productos, tarjetas y movimientos por cursor
se documenta en [ACCOUNTS.md](ACCOUNTS.md). Los endpoints anteriores mantienen
sus respuestas en array; los nuevos campos y rutas complementan el contrato.
El flujo de transferencias y el encabezado obligatorio `Idempotency-Key` se
documentan en [TRANSFERS.md](TRANSFERS.md).

| Método | Path                          | Responsabilidad                                     |
| ------ | ----------------------------- | --------------------------------------------------- |
| `GET`  | `/home`                       | Composición del menú principal                      |
| `GET`  | `/accounts`                   | Cuentas del usuario autenticado                     |
| `GET`  | `/accounts/:id/balance`       | Saldo de una cuenta propia                          |
| `GET`  | `/accounts/:id/transactions`  | Movimientos paginados por límite                    |
| `POST` | `/transfers`                  | Transferencia atómica entre cuentas de igual moneda |
| `GET`  | `/service-payments/providers` | Catálogo simulado de proveedores                    |
| `POST` | `/service-payments`           | Pago de servicio desde una cuenta propia            |

## Consistencia y seguridad

- Todos los paths funcionales requieren JWT; los health checks siguen públicos
  para la plataforma de monitoreo.
- Cada consulta de cuenta comprueba pertenencia al usuario autenticado.
- Una transferencia actualiza ambos saldos y crea ambos movimientos dentro de
  una única transacción PostgreSQL.
- El débito usa una actualización condicional `balance >= amount`, evitando
  sobregiros ante solicitudes concurrentes.
- El pago de servicio actualiza saldo, comprobante y movimiento atómicamente.
- Las transferencias entre monedas diferentes se rechazan; el cambio de moneda
  será un caso de uso independiente.
- Prisma `Decimal` conserva precisión y la API nunca responde dinero como float.
- Existe una única conexión Redis por proceso mediante `CacheStoreService`; las
  sesiones y el menú reutilizan esa infraestructura con prefijos independientes.

## Datos académicos

`pnpm prisma:seed` prepara para el usuario demo una cuenta PEN y una cuenta USD,
además de movimientos iniciales idempotentes. El seed es únicamente para
desarrollo y demostración.
