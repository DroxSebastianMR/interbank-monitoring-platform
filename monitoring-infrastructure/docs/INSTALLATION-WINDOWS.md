# Instalación completa en Windows

## Instalación automática recomendada

Para una computadora nueva, abra esta carpeta:

```text
monitoring-infrastructure\scripts\windows
```

Haga doble clic en `install-and-run.cmd` y acepte el cuadro UAC. El instalador verifica e instala los prerrequisitos y deja un log en `%LOCALAPPDATA%\InterbankMonitoring\logs`.

También puede hacer doble clic directamente en `monitoring-infrastructure\SETUP-WINDOWS.cmd`, que funciona como acceso rápido al mismo instalador.

Si Windows necesita habilitar WSL o Virtual Machine Platform, el proceso se divide obligatoriamente en dos fases:

1. Primera ejecución: habilita características y solicita reinicio.
2. Segunda ejecución: instala/inicia Docker, construye Compose y ejecuta pruebas.

No es necesario comprobar versiones manualmente; esas verificaciones forman parte del script. Las secciones siguientes documentan lo que el script realiza y sirven como procedimiento manual alternativo.

## 1. Requisitos

- Windows 10/11 de 64 bits.
- Virtualización habilitada en BIOS/UEFI.
- Al menos 8 GB de RAM recomendados.
- Docker Desktop con backend WSL 2.
- Los seis repositorios como carpetas hermanas.

Para desarrollo sin Docker también se necesitan Node.js 20, pnpm y Python 3.12.

## 2. Instalar y comprobar WSL 2

Abra PowerShell como administrador en `monitoring-infrastructure`:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\enable-docker-prerequisites.ps1
Restart-Computer
```

Después del reinicio:

```powershell
wsl --version
wsl --status
```

El valor esperado es `Versión predeterminada: 2`. Si Windows informa que la virtualización no está disponible, active Intel VT-x/VT-d o AMD-V/SVM en BIOS/UEFI.

## 3. Instalar Docker Desktop

Descargue Docker Desktop únicamente desde `https://docs.docker.com/desktop/setup/install/windows-install/`. Durante la instalación seleccione WSL 2 y contenedores Linux.

Compruebe:

```powershell
docker --version
docker compose version
docker info
```

`docker info` debe mostrar información tanto del cliente como del servidor. Si solo aparece el cliente, abra Docker Desktop y espere a que indique que el engine está ejecutándose.

## 4. Preparar variables

```powershell
cd monitoring-infrastructure
Copy-Item .env.example .env
```

Variables importantes:

| Variable | Uso |
|---|---|
| `APP_DATABASE_URL` | PostgreSQL/Supabase del sistema simulado |
| `MONITORING_DATABASE_URL` | PostgreSQL/Supabase de monitoreo |
| `APP_JWT_SECRET` | Firma JWT del App Backend |
| `MONITORING_JWT_SECRET` | Firma JWT de monitoreo |
| `SIMULATION_ENABLED` | Habilita fallos controlados |
| `MONITOR_INTERVAL_MS` | Intervalo entre checks |
| `MONITOR_TIMEOUT_MS` | Timeout de cada check |
| `GRAFANA_ADMIN_USER` | Usuario inicial de Grafana |
| `GRAFANA_ADMIN_PASSWORD` | Contraseña inicial de Grafana |

Los valores de ejemplo permiten construir y demostrar el flujo sin consultar PostgreSQL. Para persistencia real deben sustituirse las dos URLs por conexiones Supabase válidas. Nunca confirme ni suba el archivo `.env`.

## 5. Levantar todo

```powershell
docker compose up -d --build
docker compose ps
```

La primera ejecución descarga imágenes y dependencias; puede tardar varios minutos. Para seguir el progreso:

```powershell
docker compose logs -f
```

## 6. Comprobaciones rápidas

```powershell
Invoke-RestMethod http://localhost:8080/health
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:4000/monitored-services
```

Abra en el navegador:

- Dashboard: `http://localhost:5173`
- Swagger App Backend: `http://localhost:8080/api/docs`
- Swagger Monitoring: `http://localhost:4000/api/docs`
- OpenAPI IA: `http://localhost:8000/docs`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

## 7. Operación diaria

```powershell
# Iniciar
docker compose up -d

# Estado
docker compose ps

# Logs de un servicio
docker compose logs -f monitoring-backend

# Reconstruir cambios de código
docker compose up -d --build

# Detener sin eliminar datos locales
docker compose down
```

No utilice `docker compose down --volumes` salvo que quiera borrar deliberadamente los datos locales de Redis, Prometheus y Grafana.

## 8. Aplicación móvil

La app móvil se ejecuta fuera de Docker:

```powershell
cd ..\interbank-mobile
Copy-Item .env.example .env
corepack enable
pnpm install
pnpm start
```

Use `http://10.0.2.2:8080` para Android Emulator. En un teléfono físico use la IP LAN de la computadora y mantenga ambos dispositivos en la misma red.
