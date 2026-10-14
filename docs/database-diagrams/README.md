# Diagramas de bases de datos

Estos archivos representan **dos proyectos Supabase independientes**. El schema `app` pertenece al backend bancario y el schema `monitoring` al backend del monitor. El archivo combinado solo los coloca juntos para estudiar la arquitectura; no implica que compartan base de datos ni claves foráneas entre proyectos.

Para visualizarlo en [dbdiagram.io](https://dbdiagram.io/), cree un diagrama nuevo, seleccione **DBML** y pegue el contenido de `combined.dbml`. También puede importar `interbank-app.dbml` y `monitoring.dbml` por separado. Los `.postgresql.sql` contienen DDL PostgreSQL equivalente y se pueden importar como **PostgreSQL**; son exportaciones de documentación, **no migraciones para ejecutar**.

Regeneración desde los dos `prisma/schema.prisma`, sin conexión a Supabase:

```powershell
cd monitoring-infrastructure/schema-export
npm ci
npm run export
```

Se requiere `pnpm` y que las dependencias Prisma de ambos backends estén instaladas. El script comprueba con el parser oficial DBML que cada archivo conserve todas las tablas y relaciones del SQL generado. No exporta filas, URLs ni credenciales. Prisma puede omitir objetos PostgreSQL que no estén representados en el modelo (por ejemplo, triggers o vistas creadas fuera de Prisma); para un inventario físico completo de la base se necesita una inspección separada.
