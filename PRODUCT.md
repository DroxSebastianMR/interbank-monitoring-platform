# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

El usuario principal es personal de operaciones que trabaja frente al dashboard para supervisar continuamente los logs y el estado de los servicios de la aplicación.

## Product Purpose

Interbank Monitor centraliza la disponibilidad, latencia, errores, incidentes, alertas y actividad de los servicios digitales de la aplicación bancaria simulada. Su objetivo principal es permitir que operaciones detecte incidentes rápidamente y consulte métricas en tiempo real con suficiente contexto para iniciar el diagnóstico.

El producto tiene éxito cuando el operador puede reconocer en segundos qué está fallando, qué tan grave es, qué servicios están afectados y cuándo se observó el último dato confiable.

## Positioning

El dashboard combina en una sola vista operacional el estado actual de los servicios, telemetría reciente, incidentes, alertas y la topología de ejecución. Distingue explícitamente una caída confirmada de la falta de telemetría y evita presentar datos simulados cuando el backend de monitoreo no está disponible.

## Operating Context

- Uso frecuente y prolongado en un centro de operaciones.
- Supervisión de servicios, logs, métricas, incidentes y alertas en tiempo real.
- Investigación desde un resumen global hacia el detalle de cada servicio y su historial.
- Actualización periódica de datos operativos, con estados de carga, error, ausencia y datos vencidos.
- Acceso condicionado por sesión de empleado, roles y permisos.

## Capabilities and Constraints

- El frontend consume exclusivamente `monitoring-backend`.
- El resumen muestra estado general, servicios supervisados, incidentes y alertas activos, disponibilidad, latencia p95, errores HTTP y actualidad de datos.
- El catálogo y el detalle de servicios incluyen estado, criticidad, latencia, comprobaciones, transiciones, configuración e instancias.
- Incidentes, alertas y analítica todavía conservan vistas preparatorias.
- Los permisos existentes controlan lectura de dashboard, servicios, analítica y asistente, además de acciones administrativas.
- La interfaz debe preservar el comportamiento, la semántica operativa, la accesibilidad, la respuesta adaptable y las rutas actuales.
- No se deben inventar métricas, caídas ni evidencia operacional.

## Brand Commitments

- Conservar el nombre Interbank Monitor.
- Conservar el logotipo existente de Interbank.
- Conservar el verde y el azul de Interbank como colores reconocibles de marca.
- Mantener una voz clara, sobria y operativa en español.

## Evidence on Hand

- Logotipo vectorial existente: `monitoring-dashboard/src/features/auth/components/interbank-monitor-logo.tsx`.
- Tokens y paleta actuales: `monitoring-dashboard/src/index.css`.
- Flujos y datos reales del dashboard: `monitoring-dashboard/src/features/dashboard/` y `monitoring-dashboard/src/features/services/`.
- Roles y permisos: `monitoring-dashboard/src/features/auth/enums/`.
- No hay testimonios, benchmarks externos ni datos de producción que deban presentarse como evidencia.

## Product Principles

1. La anomalía más urgente debe reconocerse antes que cualquier dato secundario.
2. El estado siempre debe acompañarse de actualidad, alcance y evidencia disponible.
3. La densidad de información debe acelerar la comparación, no obligar a descifrar la pantalla.
4. El color de marca orienta la interfaz; los colores semánticos comunican severidad sin depender únicamente del color.
5. Cada pantalla debe facilitar el paso natural desde detección hacia diagnóstico.

## Accessibility & Inclusion

La interfaz debe conservar navegación por teclado, foco visible, semántica accesible y contraste suficiente. Los estados operativos no pueden depender únicamente del color y deben tener etiquetas textuales comprensibles.
