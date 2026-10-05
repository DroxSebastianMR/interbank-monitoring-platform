# Estrategia del monorepo

## Decisión

La solución se mantiene en un único repositorio privado porque los componentes pertenecen al mismo producto, comparten contratos y normalmente evolucionan de manera coordinada. Esto permite revisar en un solo pull request un cambio que afecte la aplicación móvil, su backend y la observabilidad.

No se fusionan todos los servicios en una sola aplicación. Un monorepo unifica la gestión del código; no elimina los límites arquitectónicos entre procesos desplegables.

## Límites actuales

- `interbank-app-backend` es el backend transaccional de la aplicación simulada.
- `monitoring-backend` observa y coordina el monitoreo; no debe apropiarse de reglas bancarias.
- `monitoring-ai` expone capacidades analíticas independientes.
- `monitoring-dashboard` consume la API de monitoreo.
- `monitoring-infrastructure` describe cómo se conectan y despliegan los componentes.

Si en el futuro se decide consolidar backends, debe hacerse módulo por módulo, con contratos, pruebas y migraciones explícitas. Guardarlos hoy en un monorepo facilita esa evolución sin obligar a realizar una fusión prematura.

## Convenciones

1. Cada componente mantiene su propio `README.md`, `.env.example`, pruebas y lockfile.
2. Los secretos viven fuera de Git.
3. Los contratos compartidos deben versionarse y validarse; no se duplican manualmente sin una fuente común.
4. Los cambios de base de datos incluyen migración, documentación y pruebas.
5. La raíz contiene solamente configuración transversal y documentación del producto.

## Publicación

El repositorio remoto debe crearse como privado. Antes de cada publicación se debe revisar:

- que `git status --ignored` confirme la exclusión de `.env`, `node_modules`, `dist`, cachés y temporales;
- que no existan tokens, contraseñas o certificados dentro de los archivos rastreados;
- que las pruebas y compilaciones relevantes estén aprobadas;
- que los `.env.example` contengan placeholders y no credenciales reales.
