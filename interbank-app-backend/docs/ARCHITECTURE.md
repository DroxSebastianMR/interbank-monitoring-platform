# Arquitectura del Interbank App Backend

## Objetivo

La estructura está basada en el estilo del proyecto DALI, adaptada para mantener
las capacidades existentes de este backend: Supabase/PostgreSQL, simulación de
fallos, Swagger, CORS, el logger nativo de NestJS, class-validator y pruebas. La regla principal es que
cada archivo tenga una responsabilidad clara y que el crecimiento de un módulo
no obligue a mezclar código con otros dominios.

## Estructura

```text
src/
├── common/
│   ├── errors/       # Contrato uniforme de errores
│   ├── filters/      # Conversión global de excepciones HTTP
│   └── prisma/       # Cliente PostgreSQL global
├── config/
│   ├── application/  # Identidad, defaults y contrato tipado de la aplicación
│   ├── cors/         # Orígenes, cabeceras y políticas HTTP reutilizables
│   ├── environment/  # Modelo y validación de variables de entorno
│   ├── swagger/      # Rutas, constantes y construcción de OpenAPI
│   ├── validation/   # Política global de validación de DTO
│   ├── config-module.options.ts
│   └── index.ts      # API pública de configuración
├── modules/
│   └── <feature>/
│       ├── controllers/
│       ├── dto/
│       ├── services/
│       ├── <feature>.module.ts
│       └── index.ts
├── app.module.ts     # Composition root de NestJS
└── main.ts           # Bootstrap HTTP
```

## Flujo de una solicitud

```text
Cliente
  -> Helmet y CORS
  -> ValidationPipe global
  -> Controller del módulo
  -> Service del módulo
  -> Prisma u otro proveedor
  -> Respuesta HTTP

Si ocurre un error:
  -> GlobalExceptionFilter
  -> ErrorResponse uniforme
```

## Responsabilidades

### `main.ts`

Solo inicia y configura la aplicación. Conserva el logger nativo de NestJS y registra Helmet, CORS,
validación global, filtro de errores y Swagger; abre el puerto y muestra las URLs
útiles. No debe contener reglas de negocio.

### `app.module.ts`

Es el punto de composición. Solo carga las opciones del `ConfigModule`, Prisma y
el arreglo agregado `FEATURE_MODULES`. No conoce archivos internos de
configuración, endpoints ni lógica de negocio.

### `common`

Contiene capacidades compartidas por varios módulos. `PrismaModule` es global,
por lo que los módulos de negocio pueden inyectar `PrismaService` sin volver a
declararlo. El filtro global impide que errores internos o respuestas de
validación tengan formas distintas.

### `config`

Cada subcarpeta representa una responsabilidad independiente:

- `application`: contrato `AppConfig`, metadata y valores predeterminados.
- `environment`: clase validable, constantes y función que detiene el arranque
  cuando faltan credenciales.
- `cors`: lista de orígenes, métodos, cabeceras y generador de opciones.
- `swagger`: rutas y construcción del documento OpenAPI.
- `validation`: opciones reutilizables del `ValidationPipe` global.

`config-module.options.ts` compone esas piezas para Nest y `index.ts` expone solo
la API pública. Los consumidores importan desde `@/config`, sin depender de la
ubicación interna de cada archivo.

### `modules`

Cada carpeta representa una funcionalidad. El controller traduce HTTP; el
service contiene casos de uso; los DTO describen y validan entradas; el module
declara dependencias. El `index.ts` de cada funcionalidad publica su arreglo y
`src/modules/index.ts` los agrega en `FEATURE_MODULES`, que es el único detalle
que consume `AppModule`.

## Alias `@/`

Los imports internos deben partir desde `src`:

```ts
import { AuthService } from '@/modules/auth/services/auth.service';
```

No se deben crear rutas como `../../../`. El soporte está coordinado en tres
lugares:

1. `tsconfig.json`: reconoce `@/*` durante TypeScript y desarrollo.
2. La configuración de Jest: reconoce el alias en pruebas.
3. `tsc-alias`: reescribe el código compilado para producción.

Por ese motivo el build oficial siempre debe ser `pnpm build`, no una invocación
manual incompleta a `tsc`.

## Cómo agregar un módulo

Para una funcionalidad llamada `payments`:

1. Crear `src/modules/payments/controllers`, `dto` y `services`.
2. Crear `payments.module.ts` y declarar controllers/providers.
3. Crear `index.ts` exportando `FEATURE_MODULES_PAYMENTS = [PaymentsModule]`.
4. Incorporar ese arreglo en `src/modules/index.ts`; `AppModule` no se modifica.
5. Documentar los endpoints con decoradores de Swagger.
6. Agregar pruebas unitarias del service y, si cambia el contrato HTTP, pruebas E2E.
7. Ejecutar `pnpm verify` antes de subir cambios.

## Comandos de trabajo

```powershell
# Desarrollo con recarga automática
pnpm start:dev

# Formato, lint, pruebas y build
pnpm verify

# Ejecutar exactamente el artefacto de producción
pnpm build
pnpm start:prod
```

Swagger queda en `http://localhost:3000/api/docs`; OpenAPI JSON, en
`http://localhost:3000/api/docs-json`; y Health, en
`http://localhost:3000/health`.
