# Interbank Monitoring Platform

Monorepo de una plataforma académica para simular la experiencia de una aplicación bancaria y monitorear su disponibilidad, latencia y modos de falla. No procesa operaciones financieras reales.

## Componentes

| Carpeta | Responsabilidad | Tecnología principal |
| --- | --- | --- |
| `interbank-mobile/` | Aplicación móvil bancaria simulada | Expo / React Native |
| `interbank-app-backend/` | API funcional de la aplicación móvil | NestJS / Prisma / PostgreSQL |
| `monitoring-backend/` | Orquestación y API de monitoreo | NestJS / Prisma |
| `monitoring-dashboard/` | Panel operativo y visualización | React / Vite |
| `monitoring-ai/` | Detección y análisis de anomalías | Python |
| `monitoring-infrastructure/` | Docker Compose, Prometheus, Grafana, Redis y scripts | Docker |

## Arquitectura del repositorio

Cada componente conserva sus dependencias, configuración y ciclo de pruebas. La raíz funciona como punto de coordinación y documentación, sin acoplar artificialmente proyectos Node.js, Python e infraestructura en un único paquete.

```text
Monitoring-System/
├── interbank-mobile/
├── interbank-app-backend/
├── monitoring-backend/
├── monitoring-dashboard/
├── monitoring-ai/
├── monitoring-infrastructure/
└── docs/
```

Actualmente el desarrollo funcional está concentrado en `interbank-mobile` e `interbank-app-backend`. Los módulos de monitoreo permanecen en el mismo repositorio para evolucionar y desplegar la solución completa de forma coordinada.

## Inicio rápido

1. Copiar los archivos `.env.example` de cada componente como `.env` y completar únicamente las credenciales locales.
2. En Windows, ejecutar `monitoring-infrastructure/SETUP-WINDOWS.cmd` para preparar las dependencias soportadas.
3. Consultar el `README.md` de cada carpeta para ejecutar, probar o desplegar ese componente.

Los archivos `.env`, certificados, dependencias instaladas, builds, cachés y modelos generados están excluidos del repositorio.

## Estrategia de trabajo

- Rama estable: `main`.
- Ramas de trabajo: `feature/<alcance>`, `fix/<alcance>` y `docs/<alcance>`.
- Los cambios se revisan mediante pull request.
- Las migraciones de Prisma se versionan junto con el código que las necesita.
- Ningún secreto debe almacenarse en Git; se documenta solamente en archivos `.env.example` con placeholders.

Más detalles en [docs/MONOREPO.md](docs/MONOREPO.md).
