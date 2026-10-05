# Guía de trabajo para el equipo

## 1. Cómo explicar el proyecto

La demostración bancaria es el sistema que puede fallar. La plataforma de monitoreo es el producto que debe seguir funcionando, observar ese fallo y comunicar su estado. Docker Compose reproduce ambos lados en una sola computadora sin mezclar sus responsabilidades.

## 2. Forma de trabajo

Cada componente es un repositorio Git independiente. Un cambio debe realizarse y confirmarse en el repositorio al que pertenece:

```powershell
git status
git switch -c feature/nombre-corto
git add <archivos>
git commit -m "feat: descripción del cambio"
```

No ejecute `git init` en la carpeta padre y no copie código de aplicaciones dentro de `monitoring-infrastructure`.

Para preparar una computadora del equipo no repita instalaciones manuales. Use `monitoring-infrastructure/scripts/windows/install-and-run.cmd`; el README de esa carpeta explica las dos fases y sus límites.

## 3. Qué repositorio modificar

- Pantallas del teléfono: `interbank-mobile`.
- Comportamiento bancario o simulación de fallas: `interbank-app-backend`.
- Reglas, estados, incidentes o API operacional: `monitoring-backend`.
- Inferencia o entrenamiento: `monitoring-ai`.
- Interfaz de operaciones: `monitoring-dashboard`.
- Puertos, contenedores, NGINX, k6, Prometheus o Grafana: `monitoring-infrastructure`.

## 4. Flujo recomendado para una tarea

1. Identificar el repositorio propietario.
2. Crear una rama pequeña.
3. Copiar `.env.example` a `.env` sin versionar secretos.
4. Ejecutar tests locales del componente.
5. Reconstruir el ecosistema con `docker compose up -d --build`.
6. Ejecutar smoke test y una prueba funcional relevante.
7. Actualizar README/documentación si cambian comandos, variables o endpoints.
8. Abrir revisión con evidencia de pruebas.

## 5. Convenciones

- Código, rutas, variables y archivos en inglés.
- README y explicación académica pueden estar en español.
- TypeScript estricto y DTOs validados.
- Logs estructurados; no agregar `console.log` dispersos.
- No hardcodear URLs, contraseñas ni tokens.
- No conectar dashboard o móvil directamente a PostgreSQL, Redis o IA.
- No permitir que la IA decida por sí sola que un servicio está caído.

## 6. Definición de terminado

Un cambio está terminado cuando:

- Compila.
- Sus tests pasan.
- No incluye secretos.
- Mantiene separación de responsabilidades.
- Funciona en Docker si afecta ejecución integrada.
- Incluye documentación cuando cambia el uso.
- Tiene una prueba manual reproducible.

## 7. Preguntas frecuentes

**¿Por qué hay dos App Backends?** Son dos contenedores de la misma imagen para demostrar balanceo y failover; no hay código duplicado.

**¿Por qué no hay PostgreSQL en Compose?** Supabase proporciona PostgreSQL remoto. Se evita una base local distinta al entorno previsto.

**¿Redis reemplaza PostgreSQL?** No. Redis almacena estado rápido/temporal y colas; PostgreSQL conserva historia durable.

**¿Grafana reemplaza el dashboard?** No. Grafana muestra telemetría técnica; el dashboard muestra estado operacional del producto.

**¿El baseline es Machine Learning entrenado?** No. Es una señal inicial transparente. Isolation Forest solo se activará tras entrenar y evaluar datos reales.

**¿Por qué el móvil no está en Docker?** Expo necesita interactuar con emulador o dispositivo físico y se ejecuta mejor desde el host durante esta fase.
