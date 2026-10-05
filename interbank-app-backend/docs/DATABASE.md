# PostgreSQL, Prisma y pool de conexiones

## Diseño actual

`PrismaModule` es global y crea una sola instancia de `PrismaService` por proceso
NestJS. Nunca se instancia `PrismaClient` dentro de un controller o por solicitud.
Cada proceso mantiene su propio pool, por eso el límite debe considerar la
cantidad máxima de réplicas del backend.

Supabase ofrece dos conexiones con responsabilidades distintas:

- `DATABASE_URL`: pooler de transacciones, puerto `6543`, para tráfico normal de
  la API. La plantilla limita Prisma a cinco conexiones por instancia y espera
  hasta diez segundos en la cola del pool.
- `DIRECT_URL`: pooler de sesión, puerto `5432`, para migraciones, introspección y
  tareas administrativas que requieren continuidad de sesión.

La fórmula no es universal. `connection_limit=5` es un punto inicial conservador
para las dos réplicas definidas en este proyecto. Debe ajustarse con métricas de
latencia, concurrencia, errores `P2024` y el límite real del plan de Supabase.

## Reducción de carga en autenticación

El primer login realiza una lectura indexada del usuario y actualiza
`lastLoginAt`. Después crea una sesión distribuida. El device login lee Redis,
verifica dispositivo y prueba HMAC, rota el token y emite el JWT sin consultar
PostgreSQL. Esto permite que ambas instancias compartan sesiones sin duplicar
lecturas de usuario.

La caché en memoria existe solo para desarrollo de un proceso. Los contenedores
deben usar `SESSION_CACHE_DRIVER=redis`; de lo contrario una sesión creada por
una réplica no será visible para la otra.

## Operación

```powershell
pnpm prisma:generate
pnpm prisma migrate status
pnpm prisma:migrate
```

`generate` actualiza tipos locales y suele eliminar diagnósticos obsoletos del
editor. `migrate status` es de lectura. `prisma:migrate` despliega únicamente las
migraciones versionadas pendientes.

Referencias técnicas: [pool de Prisma ORM v6](https://www.prisma.io/docs/orm/v6/prisma-client/setup-and-configuration/databases-connections/connection-pool)
y [almacenamiento de sesiones en Redis](https://redis.io/docs/latest/develop/use-cases/session-store/).
