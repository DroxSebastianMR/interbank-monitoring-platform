# Instalador automático para Windows

## Uso rápido

1. Abra `monitoring-infrastructure/scripts/windows`.
2. Haga doble clic en `install-and-run.cmd`.
3. Acepte una vez el cuadro UAC de Windows.
4. Si el script habilita WSL o Virtual Machine Platform, acepte el reinicio.
5. Después del reinicio, ejecute `install-and-run.cmd` nuevamente.

La segunda ejecución continúa de forma idempotente: actualiza WSL 2, instala Docker Desktop si falta, inicia Docker, crea `.env` sin sobrescribir uno existente, construye los contenedores, verifica endpoints y ejecuta k6 smoke.

## Qué automatiza

- Verifica Windows de 64 bits y versión compatible.
- Se autoeleva mediante UAC.
- Habilita WSL y Virtual Machine Platform.
- Configura el hipervisor de Windows.
- Actualiza WSL y configura versión 2.
- Descarga Docker Desktop desde el dominio oficial.
- Verifica la firma Authenticode de Docker Inc.
- Instala Docker con backend WSL 2 y acepta la licencia mediante el instalador oficial.
- Espera a que Docker Engine esté disponible.
- Ejecuta `docker compose up -d --build`.
- Comprueba App Backend, Monitoring Backend, IA, Dashboard y Prometheus.
- Ejecuta `k6/smoke.js`.
- Presenta un resumen final en color con las versiones instaladas, servicios activos y URLs.
- Guarda logs en `%LOCALAPPDATA%\InterbankMonitoring\logs`.

## Límites inevitables

- Windows siempre exige que una persona acepte el cuadro UAC. El script no lo evita.
- Un cambio de características de virtualización requiere reinicio.
- La virtualización de CPU debe habilitarse manualmente en BIOS/UEFI si está desactivada.
- El script no inventa credenciales de Supabase. Crea `.env` desde el ejemplo para la demostración no persistente; cada entorno real debe configurar sus propias URLs y secretos.
- Requiere conexión a Internet para WSL, Docker e imágenes.

## Opciones avanzadas

Desde PowerShell administrativo:

```powershell
.\bootstrap.ps1 -SkipSmokeTest
.\bootstrap.ps1 -SkipProjectStart
.\bootstrap.ps1 -SkipDockerInstall
.\bootstrap.ps1 -RestartWhenRequired
```

Todas las operaciones pueden repetirse: no se sobrescribe `.env` y no se reinstala Docker si ya existe.

## Arquitectura de scripts

```text
scripts/windows/
├── install-and-run.cmd       # Lanzador de doble clic
├── bootstrap.ps1             # Orquestador del flujo
└── modules/
    ├── Common.psm1           # Logging, elevación y utilidades
    ├── WindowsPrerequisites.psm1
    ├── DockerDesktop.psm1
    └── ProjectSetup.psm1
```

La separación mantiene una sola responsabilidad por módulo y permite probar o reemplazar cada parte sin convertir el instalador en un archivo monolítico.
