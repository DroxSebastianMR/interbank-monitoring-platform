# Asistente operativo del monitor

El detector de anomalías y las alertas continúan funcionando sin OpenRouter. El proveedor de lenguaje solo responde consultas iniciadas por empleados; no decide el estado final de un servicio ni ejecuta remediaciones.

## Configuración

En `monitoring-infrastructure/.env` (Docker), definir sin comillas:

```dotenv
ASSISTANT_PROVIDER=openrouter
OPENROUTER_API_KEY=<clave_privada>
OPENROUTER_MODEL=openai/gpt-4.1-mini
AI_INTERNAL_TOKEN=<secreto_aleatorio_de_al_menos_32_caracteres>
```

El mismo `AI_INTERNAL_TOKEN` se entrega al Monitoring Backend y al servicio Python mediante Compose. No poner estas variables en Vite, Expo, Git ni Swagger. La clave no debe enviarse al equipo por chat. Para ejecución manual, usar `monitoring-ai/.env` para las cuatro variables y `monitoring-backend/.env` para `AI_INTERNAL_TOKEN`.

El modelo debe tener soporte de **structured outputs** en un proveedor compatible con la preferencia de privacidad (`zdr` y `data_collection: deny`). Si no hay un proveedor elegible, la llamada falla de forma segura y se devuelve un resumen determinista. Para desarrollo sin clave, dejar `ASSISTANT_PROVIDER=none`.

Después de configurar las variables, reconstruir únicamente los servicios modificados:

```powershell
cd monitoring-infrastructure
docker compose up -d --build monitoring-ai monitoring-backend monitoring-dashboard
```

Esta orden recrea esos tres contenedores brevemente; Redis, Prometheus, Nginx y los dos backends bancarios no se reinician. Verificar `docker compose ps` y `http://localhost:4000/api/docs` antes de entrar a `http://localhost:5173/assistant`.

## Contrato y límites

- Nest valida JWT, permisos y propiedad de cada conversación; PostgreSQL guarda historial, evidencia referenciada, latencia y consumo de tokens.
- Swagger documenta conversaciones, mensajes, feedback, ejecución y capacidades. `POST /assistant/ask` sigue disponible temporalmente como consulta sin historial.
- Python solo recibe evidencia acotada sobre servicios, incidentes y tráfico agregado. El prompt de sistema limita el alcance al proyecto; las preguntas e incidentes se consideran datos no confiables. La salida JSON se valida y sus IDs se cotejan con la evidencia enviada.
- No se consultan transacciones individuales ni se envían credenciales. Un modelo puede equivocarse: la interfaz diferencia respuestas del proveedor de resúmenes locales y muestra la hora de observación.
- La imagen y el streaming permanecen deshabilitados hasta configurar almacenamiento privado, validación de archivos y pruebas específicas. `GET /assistant/capabilities` publica estas capacidades sin prometer funciones incompletas.
- El historial está limitado a 50 conversaciones y los últimos 50 mensajes por conversación en la API actual; la siguiente iteración debe incorporar cursores y retención automática antes de una operación prolongada.

## Verificación sin clave

```powershell
cd monitoring-ai
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m scripts.benchmark_assistant
cd ..\monitoring-backend
pnpm prisma:migrate
pnpm prisma:seed
node --env-file=.env scripts/verify-assistant-db.mjs
node --env-file=.env scripts/verify-assistant-http.mjs
pnpm lint
pnpm test --runInBand
pnpm build
```

Las pruebas de base y HTTP crean datos/empleados temporales y los eliminan al terminar. La prueba HTTP requiere el Monitoring Backend activo en el puerto 4000; se puede cambiar con `ASSISTANT_TEST_URL`. El benchmark Python mide solo la ruta determinista dentro del proceso: no representa el tiempo de red, PostgreSQL ni la latencia/costo real de OpenRouter.
