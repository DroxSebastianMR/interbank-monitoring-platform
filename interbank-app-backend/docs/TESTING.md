# Pruebas, mocks y datos

## Qué significa `.spec.ts`

Un archivo `*.spec.ts` contiene especificaciones automatizadas que Jest ejecuta
con `pnpm test`. Cada `describe` agrupa el comportamiento de una clase y cada
`it` expresa un resultado verificable. No es código que atienda solicitudes ni
se empaqueta en `dist`.

## Qué es un mock

Un mock sustituye temporalmente una dependencia durante una prueba unitaria. En
`login.service.spec.ts`, el repositorio, Redis, bcrypt y JWT son mocks. Así se
comprueba exclusivamente la lógica de `LoginService`, sin conectarse a Supabase
ni depender de red. Además de devolver datos controlados, un mock permite
verificar interacciones; por ejemplo, la prueba asegura que `deviceLogin` no llama
al repositorio de PostgreSQL.

Un mock no es información real ni una carga inicial de la base de datos:

- `*.spec.ts`: escenario automatizado y aislado.
- mock: doble de prueba que reemplaza una dependencia.
- `prisma/seed.ts`: datos académicos reproducibles guardados en PostgreSQL.
- `prisma/migrations/*`: cambios versionados de la estructura de la base.
- prueba E2E: levanta la aplicación y valida el contrato HTTP completo.

## Comandos

```powershell
pnpm test --runInBand
pnpm test -- login.service.spec.ts --runInBand
pnpm test:e2e
pnpm verify
```

Las pruebas unitarias pueden ejecutarse sin Supabase. Las E2E y las comprobaciones
de migración requieren los servicios externos configurados en `.env`.

## Benchmark de autenticación

Con el backend iniciado, el benchmark realiza un primer login y hasta cinco
device logins secuenciales, siguiendo la rotación real del token. Informa media,
p50 y p95 sin mostrar credenciales ni tokens:

```powershell
pnpm benchmark:auth
```

El máximo predeterminado de cinco muestras respeta el throttling del endpoint.
Para un ensayo de carga se debe utilizar un ambiente aislado con límites propios;
no se desactiva la protección contra fuerza bruta en desarrollo compartido ni en
producción para obtener una cifra más favorable.

El comando también falla con un código distinto de cero cuando supera los
presupuestos locales iniciales: `first-login <= 2500 ms` y p95 de
`device-login <= 100 ms`. Pueden ajustarse para un ambiente de rendimiento
dedicado mediante `BENCHMARK_FIRST_LOGIN_BUDGET_MS` y
`BENCHMARK_DEVICE_LOGIN_P95_BUDGET_MS`, sin modificar el código.
