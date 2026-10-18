# Mejoras técnicas propuestas a partir de los videos

Este documento transforma las ideas de los tres videos compartidos el 18 de octubre de 2026 en mejoras aplicables a **Monitoring System**. No todas deben implementarse de inmediato: se priorizan según el riesgo real, el alcance universitario del proyecto y la arquitectura existente.

## Resumen ejecutivo

| Video | Técnica principal | Aplicación en el proyecto | Prioridad |
| --- | --- | --- | --- |
| Servidor atacado constantemente | Endurecimiento del servidor: SSH con llaves, firewall mínimo, Fail2ban y actualizaciones | Proteger el host donde se desplieguen Nginx, Docker, Redis, Prometheus, Grafana y las API | P0 antes de publicar en Internet |
| Compra que tarda 8 segundos | Cola de mensajes, workers y procesamiento en segundo plano | Desacoplar correos, reportes, alertas, análisis de IA y otras tareas lentas de la respuesta HTTP | P1 |
| Formulario vulnerable | Consultas parametrizadas y prohibición de concatenar SQL | Mantener Prisma y los parámetros separados del SQL, incluyendo las consultas con bloqueo de filas | P0 permanente |

## Estado actual observado

Implementación posterior: [catálogo automático de endpoints por instancia](ENDPOINT-OBSERVABILITY.md), con permisos, métricas acotadas y caché agrupada. Incluye la restricción de Prometheus a loopback en el Compose de desarrollo actual.

El proyecto ya cuenta con varias defensas correctas:

- `helmet` está habilitado en los dos backends NestJS.
- Existe validación global con `whitelist`, `forbidNonWhitelisted` y transformación de DTO.
- Los endpoints sensibles incorporan JWT, permisos y limitación de solicitudes en distintos módulos.
- Nginx distribuye tráfico entre dos instancias del backend móvil y define tiempos máximos de conexión y respuesta.
- Los contenedores de ambos backends y del servicio de IA ejecutan procesos con usuarios sin privilegios.
- Prisma se utiliza como capa principal de acceso a datos.
- Las consultas SQL manuales encontradas usan *tagged templates* de Prisma (`$queryRaw` y `$executeRaw`) con valores parametrizados.
- No se encontraron usos de `$queryRawUnsafe` ni `$executeRawUnsafe` en el código de producción revisado.
- El backend del monitor declara BullMQ, Redis y nombres de colas, pero `QueuesModule` todavía solo publica constantes: no crea colas, productores, workers ni políticas de reintento.

También existen riesgos que deben separarse entre desarrollo y producción:

- `docker-compose.yml` utiliza `NODE_ENV=development` en los backends.
- Redis tiene `protected-mode no`; actualmente está dentro de la red Docker, pero `docker-compose.dev.yml` publica el puerto `6379` en el host.
- Prometheus, Grafana y el backend del monitor publican puertos directamente.
- Grafana conserva un valor por defecto `change-me` si no se configura una contraseña.
- Nginx aún no configura TLS, límites por IP, tamaño máximo de cuerpo ni cabeceras defensivas propias del proxy.
- No existe una guía de endurecimiento del host para un despliegue público.

## 1. Endurecimiento del servidor

### Objetivo

Reducir la superficie de ataque del host. Esta capa es diferente de la seguridad de NestJS: aunque la aplicación valide correctamente, un servidor expuesto con SSH débil o puertos innecesarios continúa siendo vulnerable.

### Alcance recomendado

Estas medidas corresponden a una VM o servidor Linux de despliegue. No deben aplicarse literalmente a Docker Desktop en la computadora de desarrollo.

#### Acceso administrativo

- Crear un usuario de despliegue sin acceso directo como `root`.
- Utilizar llaves SSH; deshabilitar el inicio por contraseña después de verificar el acceso con llave.
- Deshabilitar el acceso SSH directo de `root`.
- Restringir SSH por VPN, red administrativa o lista de IP cuando sea posible.
- Rotar llaves comprometidas y mantener un procedimiento de recuperación fuera del servidor.

#### Firewall

Permitir solamente los puertos necesarios:

| Puerto | Uso | Exposición recomendada |
| --- | --- | --- |
| 22 | SSH | Solo red o IP administrativa |
| 80 | Redirección HTTP | Público únicamente si redirige a HTTPS |
| 443 | HTTPS/Nginx | Público |
| 3000/3002 | Instancias de la app | Solo red Docker |
| 4000 | Backend del monitor | Solo Nginx o red privada |
| 6379 | Redis | Nunca público |
| 8000 | IA | Solo backend del monitor |
| 9090 | Prometheus | Solo red privada o VPN |
| 3001 | Grafana | Red privada, VPN o proxy autenticado |

#### Protección automática

- Instalar Fail2ban para SSH y, si corresponde, reglas basadas en registros de Nginx.
- Habilitar actualizaciones automáticas de seguridad del sistema operativo.
- Aplicar parches controlados a imágenes Docker y dependencias.
- Ejecutar análisis periódico de vulnerabilidades de imágenes.
- Centralizar registros de autenticación, bloqueos y cambios administrativos.
- Configurar alertas ante múltiples fallos de acceso, reinicios continuos o uso anómalo de CPU, memoria y disco.

### Mejoras concretas en la infraestructura del repositorio

1. Crear un `docker-compose.prod.yml` separado del archivo de desarrollo.
2. Usar `NODE_ENV=production` en los backends desplegados.
3. No publicar Redis, la IA, las instancias internas ni Prometheus en interfaces públicas.
4. Configurar una contraseña o ACL de Redis y pasarla mediante secretos.
5. Exigir contraseñas no predeterminadas para Grafana.
6. Incorporar HTTPS en Nginx o documentar que TLS termina en un balanceador externo.
7. Añadir en Nginx límites de solicitudes, cuerpo máximo, timeouts y cabeceras de seguridad.
8. Establecer límites de CPU/memoria, políticas de reinicio y sistemas de archivos de solo lectura donde sea viable.
9. Separar secretos del archivo `.env` compartido mediante secretos de despliegue.
10. Añadir respaldos, restauración probada y política de retención para ambas bases Supabase.

### Criterios de aceptación

- Un escaneo externo solo detecta 80/443 y el acceso administrativo expresamente permitido.
- Redis, Prometheus, IA y backends internos no son accesibles directamente desde Internet.
- Ningún servicio arranca con contraseñas predeterminadas.
- La pérdida de una instancia no interrumpe el tráfico mientras otra permanezca sana.
- Existe evidencia de restauración de respaldo en un entorno de prueba.

## 2. Colas de mensajes y workers

### Problema que resuelve

Una petición HTTP no debería esperar a que terminen acciones secundarias como enviar correos, construir PDFs, generar reportes, analizar métricas con IA o distribuir notificaciones. Mantenerlas dentro de la petición aumenta la latencia, consume conexiones y provoca reintentos del usuario.

### Regla arquitectónica

La operación que el usuario necesita confirmar debe terminar de forma síncrona. Los efectos secundarios pueden ejecutarse en segundo plano.

Ejemplo recomendado:

```text
Cliente
  -> API valida y confirma la operación principal
  -> transacción PostgreSQL guarda la operación + evento Outbox
  -> API responde al cliente
  -> publicador entrega el evento a Redis/BullMQ
  -> worker procesa correo, alerta, PDF o análisis
  -> worker registra resultado, intento y error
```

### Qué debe permanecer síncrono

- Autenticación y autorización.
- Verificación de propiedad de cuentas.
- Débito y crédito de una transferencia interna.
- Registro de idempotencia.
- Confirmación del pago de servicio dentro del simulador.
- Emisión consistente del identificador y comprobante básico de la operación.

No se debe responder “transferencia completada” antes de confirmar la transacción monetaria en PostgreSQL.

### Qué puede ir a una cola

- Correo o notificación posterior a una transferencia.
- Generación de un PDF de constancia.
- Notificaciones del monitor.
- Evaluación adicional de anomalías por IA.
- Agregación de métricas históricas.
- Construcción de reportes extensos.
- Limpieza de sesiones, códigos y datos vencidos.
- Reintentos de integraciones externas no críticas para la respuesta inmediata.

### Diseño recomendado para este proyecto

Se recomienda aprovechar Redis y BullMQ, que ya son parte del backend del monitor, antes de introducir Kafka o RabbitMQ. Kafka sería justificable si el proyecto necesitara alto volumen de eventos durables, múltiples consumidores independientes y reproducción histórica; actualmente aumentaría la complejidad operativa sin una necesidad demostrada.

Componentes propuestos:

- `QueueModule`: conexión compartida con Redis y registro tipado de colas.
- `QueueProducer`: único punto para publicar trabajos.
- `NotificationWorker`: procesa notificaciones.
- `MonitoringAnalysisWorker`: procesa análisis no interactivo.
- `ReportWorker`: crea reportes o constancias pesadas.
- `OutboxPublisher`: lee eventos confirmados en PostgreSQL y los publica.
- `DeadLetterService`: conserva trabajos agotados para revisión.

### Modelo mínimo de datos

Una tabla `outbox_events` debería contener, como mínimo:

- `id`
- `eventType`
- `aggregateType`
- `aggregateId`
- `payload`
- `status`
- `attempts`
- `availableAt`
- `processedAt`
- `lastError`
- `createdAt`

La operación y el evento Outbox deben guardarse en la misma transacción SQL. Publicar directamente a Redis y luego guardar en PostgreSQL, o hacerlo al revés sin Outbox, deja una ventana de inconsistencia.

### Requisitos de confiabilidad

- `jobId` determinista para impedir duplicados.
- Workers idempotentes.
- Reintentos con *exponential backoff* y variación aleatoria.
- Número máximo de intentos.
- Cola de trabajos fallidos.
- Tiempo máximo de ejecución por tipo de tarea.
- Concurrencia configurada por worker.
- Cierre controlado para no perder trabajos durante un despliegue.
- Métricas: pendientes, activos, completados, fallidos, reintentos, antigüedad y duración.
- Alertas por acumulación de cola y tasa de errores.
- Payloads pequeños; documentos y archivos deben guardarse externamente y referenciarse por identificador.
- No incluir contraseñas, tokens ni datos personales innecesarios en el payload.

### Pruebas necesarias

- El endpoint responde sin esperar el trabajo secundario.
- Repetir el mismo evento no duplica correos, reportes ni notificaciones.
- Una caída de Redis no revierte una transacción ya confirmada y el evento queda pendiente en Outbox.
- El worker reintenta errores transitorios y envía errores permanentes a la cola de fallidos.
- Reiniciar un worker no pierde ni duplica el resultado final.
- Una carga elevada incrementa la cola sin saturar la base de datos.

## 3. Prevención de inyección SQL

### Principio

El SQL y los datos enviados por el usuario deben viajar separados. Nunca se debe formar una consulta concatenando o interpolando manualmente texto no confiable.

### Situación actual

Prisma protege las operaciones normales mediante parámetros. Las consultas manuales de transferencias y Plin utilizan la forma parametrizada de Prisma:

```ts
await tx.$queryRaw`
  SELECT ...
  WHERE a.id IN (${sourceId}::uuid, ${destinationId}::uuid)
  FOR UPDATE
`;
```

Los valores interpolados en un *tagged template* son enviados como parámetros; no se convierten en fragmentos SQL. Esta práctica debe conservarse.

### Reglas obligatorias

- Preferir `findUnique`, `findFirst`, `findMany`, `create`, `update` y transacciones de Prisma.
- Permitir `$queryRaw`/`$executeRaw` únicamente cuando Prisma no exprese el bloqueo o la consulta requerida.
- Prohibir `$queryRawUnsafe` y `$executeRawUnsafe` en código de producción.
- No concatenar filtros, ordenamientos, nombres de tabla o columnas provenientes del cliente.
- Para ordenamientos dinámicos, usar una lista cerrada que traduzca valores permitidos a expresiones conocidas.
- Validar DTO, UUID, enumeraciones, longitudes y rangos antes de llegar al repositorio.
- Usar un usuario PostgreSQL con los privilegios mínimos necesarios.
- No mostrar errores SQL, nombres internos ni consultas en respuestas HTTP.
- Registrar el tipo de fallo y un identificador de correlación, no valores sensibles completos.

### Controles automatizados

- Añadir una verificación CI que falle al detectar `queryRawUnsafe`, `executeRawUnsafe` o concatenación sospechosa cerca de SQL.
- Revisar consultas manuales como parte obligatoria del *code review*.
- Incorporar pruebas con entradas como comillas, comentarios SQL, Unicode inesperado y cadenas muy largas.
- Ejecutar pruebas de autorización junto con las de inyección: una consulta parametrizada todavía puede filtrar datos ajenos si falta el `userId` autenticado.

### Criterios de aceptación

- La búsqueda de métodos `Unsafe` en producción devuelve cero resultados.
- Las entradas maliciosas se tratan como datos o se rechazan con `400`; nunca alteran el esquema.
- Ningún error de base de datos expone SQL en la respuesta.
- Todas las consultas de recursos personales incluyen una restricción de propietario o permiso equivalente.

## 4. Orden de implementación

### Fase 1 — P0: seguridad inmediata

- Mantener la prohibición de SQL inseguro y añadir comprobación automática.
- Proteger los endpoints de simulación para que solo funcionen en desarrollo o con permiso administrativo.
- Crear configuración de producción sin publicación de puertos internos.
- Eliminar contraseñas predeterminadas y proteger Redis.
- Documentar firewall, SSH, actualizaciones y recuperación.

### Fase 2 — P1: trabajos asíncronos confiables

- Implementar BullMQ realmente en `monitoring-backend`.
- Crear un worker de notificaciones como primer caso pequeño.
- Añadir métricas de cola a Prometheus.
- Implementar Outbox antes de conectar tareas críticas derivadas de transacciones.
- Añadir reintentos, idempotencia y cola de fallidos.

### Fase 3 — P1: observabilidad y operación

- Alertas por fallos de autenticación, trabajos fallidos y acumulación de cola.
- Panel de Grafana para latencia, errores, salud de instancias y workers.
- Correlación mediante `requestId`, `jobId`, `eventId` y `operationId`.
- Procedimientos de respaldo, restauración, rotación de secretos e incidentes.

### Fase 4 — P2: validación de capacidad

- Pruebas k6 para comparar endpoints síncronos con efectos secundarios en cola.
- Pruebas de caída de Redis, una instancia, IA y proveedor externo.
- Ajustar concurrencia, conexiones, timeouts y límites usando resultados medidos.

## 5. Decisiones que deben evitarse

- Instalar Kafka solo porque se usa en empresas grandes.
- Mover débitos y créditos centrales a un worker y responder antes de confirmar la operación.
- Usar Redis como única fuente durable de una operación monetaria.
- Permitir acceso público a Redis, Prometheus o la API de IA.
- Usar una contraseña débil solo porque el entorno es universitario y luego reutilizar el archivo en producción.
- Ejecutar SQL generado por texto de usuarios o por respuestas de un modelo de IA.
- Guardar secretos, contraseñas o tokens dentro de trabajos de cola.
- Confundir Fail2ban con protección completa frente a ataques de aplicación.

## 6. Resultado esperado

Al completar estas mejoras, el sistema deberá responder rápido sin sacrificar consistencia, resistir entradas maliciosas, aislar servicios internos y producir evidencia observable cuando una tarea falle. Para este proyecto, el objetivo profesional no es acumular tecnologías: es demostrar límites claros, transacciones correctas, recuperación ante fallos y controles verificables.

La resolución implementada de telemetría, el significado de los estados, la frecuencia de `0.1 Hz`, los resultados de rendimiento y la metodología de iteración están documentados en [TELEMETRY-PERFORMANCE.md](./TELEMETRY-PERFORMANCE.md).

## Videos analizados

- `WhatsApp Video 2026-10-18 at 8.00.47 AM.mp4`: ataques automatizados y endurecimiento del servidor.
- `WhatsApp Video 2026-10-18 at 8.00.26 AM.mp4`: colas de mensajes y workers para tareas pesadas.
- `WhatsApp Video 2026-10-18 at 8.00.20 AM.mp4`: inyección SQL y consultas parametrizadas.
