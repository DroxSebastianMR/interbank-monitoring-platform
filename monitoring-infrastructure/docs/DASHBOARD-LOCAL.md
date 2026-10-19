# Dashboard local en Windows

Requiere Docker Desktop iniciado con contenedores Linux / WSL 2. Desde la raíz del repositorio:

```powershell
.\monitoring-infrastructure\scripts\windows\dashboard-local.ps1 Start
```

El comando construye e inicia el dashboard actual y sus dependencias. La primera ejecución descarga imágenes y dependencias; las siguientes reutilizan la caché. No ejecuta suites de pruebas ni generadores de carga.

## Acceso

- Dashboard: http://localhost:5173
- Monitoring Backend / Swagger: http://localhost:4000/api/docs
- API bancaria simulada: http://localhost:8080/health
- Prometheus local: http://localhost:9090
- Usuario del laboratorio: `admin@monitoring.local`.
- Contraseña: valor `LOCAL_ADMIN_PASSWORD` del archivo local `tmp/dashboard-runtime/.env`. No publicar ese archivo ni copiarlo al frontend.

Los puertos publicados se limitan a 127.0.0.1. PostgreSQL y Redis permanecen en la red interna de Docker. La base de datos es nueva y local; no se reutilizan credenciales ni datos de Supabase. Los volúmenes conservan datos al detener el entorno. No se habilitan envíos de notificaciones ni proveedores externos de IA.

## Comandos

```powershell
.\monitoring-infrastructure\scripts\windows\dashboard-local.ps1 Status
.\monitoring-infrastructure\scripts\windows\dashboard-local.ps1 Logs
.\monitoring-infrastructure\scripts\windows\dashboard-local.ps1 Stop
```

Después de modificar el dashboard, repetir `Start` para reconstruirlo. Los contenedores siguen ejecutándose al cerrar la terminal; `Stop` los detiene sin borrar datos.

## Compatibilidad de esta rama

El backend de `develop` es anterior a los contratos que consume el dashboard actual. Para ejecutar una integración real sin sustituir archivos de otros módulos, el script extrae una copia de los servicios de la referencia local `main` en `tmp/dashboard-runtime/source`. Se registra el commit exacto en `source-commit.txt`; la copia se reutiliza en posteriores arranques. Los cambios de trabajo en los backends no se incorporan a esta copia. El dashboard sí se construye directamente desde `monitoring-dashboard` con los cambios actuales.

`tmp/` ya está ignorado por Git. El script no cambia de rama, no ejecuta merges ni modifica los `.env` de los módulos. Las migraciones y el seed existentes se aplican únicamente al PostgreSQL local dedicado, antes de iniciar los servicios.

La disponibilidad y los percentiles necesitan acumular observaciones reales; no se rellena el histórico con datos inventados. Un histórico todavía insuficiente debe mostrarse sin valor. El asistente generativo necesita configuración adicional y no forma parte de este arranque.

## Arranque comprobado

Se construyeron las imágenes y se aplicaron las migraciones locales. Los nueve servicios de ejecución quedaron activos; los dos inicializadores finalizaron con código 0. Se comprobó HTTP 200 para el dashboard, login autenticado y las rutas de resumen, métricas, topología, servicios, incidentes, alertas y snapshot de endpoints. El resumen devolvió tres servicios operativos con observaciones recientes (`CURRENT`). La sesión utilizada para comprobar acceso se cerró al terminar; el usuario puede iniciar su propia sesión desde la pantalla de login.

Esta comprobación corresponde al entorno Docker local, no a Supabase ni a un despliegue de producción. No se ejecutaron suites de pruebas ni tráfico artificial para rellenar indicadores.
