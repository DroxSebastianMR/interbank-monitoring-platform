# Asistente de monitoreo: conversación y autorización

## Límite de confianza

`Dashboard → Monitoring Backend → Monitoring AI → OpenRouter`. El navegador nunca recibe la clave de OpenRouter ni decide roles. `JwtAccessGuard` obtiene el empleado y sus permisos desde la sesión vigente; `PermissionsGuard` exige `assistant.ask` o `assistant.read` en cada ruta. El servicio vuelve a exigir `assistant.ask` para no depender solo del controlador, y Monitoring AI valida nuevamente ese permiso antes de llamar a OpenRouter.

Antes de llamar al modelo, Monitoring Backend aplica la política de temas protegidos y prepara únicamente evidencia autorizada: `services.read` habilita estados, `incidents.read` habilita incidentes y `analytics.read` habilita métricas. Las preguntas por administración, empleados, auditoría, logs y seguridad requieren sus permisos específicos; las credenciales no se exponen a ningún rol. La conversación pertenece al empleado autenticado. Una huella de sus permisos acompaña cada mensaje nuevo y evita reutilizar en el prompt respuestas generadas antes de un cambio de permisos.

Los datos de roles/permisos del modelo son contexto proveniente del backend, no autorizan lecturas adicionales. Una pregunta sobre el rol o los permisos propios se responde con los valores de la sesión autenticada; no se confunde con una solicitud de administrar roles ajenos. El asistente no tiene herramientas de escritura ni acceso directo a SQL. Actualmente no se proporcionan al modelo listados de empleados, roles, auditoría o logs, incluso si el usuario tiene permiso de lectura: debe reconocer la ausencia de evidencia, no inventarlos. Incorporar una fuente nueva exige un proveedor de datos filtrado por autorización y pruebas específicas.

## Conversación y alcance

Monitoring AI envía a OpenRouter un rol de sistema versionado, la pregunta, hasta seis mensajes recientes compatibles con los roles y permisos actuales y la evidencia redactada. El modelo devuelve JSON estructurado (`inScope`, `answer`, IDs de evidencia). Los saludos y preguntas sociales breves están permitidos, sin afirmar que el sistema está sano antes de revisar métricas. Las preguntas claramente ajenas se rechazan antes de invocar al modelo. Si el modelo marca por error una pregunta admitida como ajena, se descarta su texto y se ofrece un resumen local basado en la evidencia, no la negativa genérica. Si OpenRouter no responde, se usa ese respaldo local marcado `deterministic`.

No se confunde calidez con certeza: emojis opcionales solo en contexto social, ninguna emoción humana fingida, hora de observación para estados técnicos, ausencia de predicciones no calibradas y respuesta a cada parte permitida de una pregunta compuesta. El contenido del usuario, historial, títulos de incidentes y nombres de servicios son datos no confiables; ninguna instrucción incluida en ellos puede cambiar la política. Secretos y correos se redactan antes de persistir nuevos mensajes y antes de la inferencia.

La evidencia de incidentes incluye apertura, última observación, severidad y resolución. El monitor actual verifica servicios por el gateway; la topología de `app-backend-1` y `app-backend-2` está configurada, pero no instrumentada por instancia. Por tanto, una pregunta por la última caída de una instancia recibe un informe factual construido por el backend, sin pedir al LLM que complete huecos: indica que no puede confirmar la caída de una instancia y distingue el incidente de servicio más reciente con sus fechas. Un incidente `RESOLVED` no demuestra qué instancia falló ni cuál fue la causa raíz.

## Límites actuales y verificación

- OpenRouter aporta lenguaje, no autorización. El filtro previo de temas protegidos es deliberadamente conservador; expresiones nuevas deben añadirse a pruebas y política.
- El asistente no tiene acceso a datos administrativos detallados ni a registros de base de datos. No puede ejecutar cambios, diagnosticar causas sin evidencia ni garantizar que un servicio no caerá.
- La clasificación de temas ajenos hecha por un LLM no es infalible. Debe evaluarse con consultas normales, reformulaciones, preguntas mixtas e inyección de prompts; las pruebas automatizadas cubren casos representativos, no todos los ataques posibles.
- OpenRouter puede tardar varios segundos. El backend espera hasta 18 s y el cliente HTTP de IA hasta 16 s antes de usar el respaldo local; esto evita descartar respuestas válidas cercanas al límite anterior de 9 s, pero no convierte el chat en una función de tiempo real.
- Las rutas de consulta y envío admiten hasta 20 solicitudes por minuto; el límite anterior de 10 provocaba rechazos en una conversación de prueba de varias preguntas consecutivas.
- El script `scripts/verify-assistant-http.mjs` comprueba autenticación, aislamiento de conversaciones, rol `VIEWER`, rechazo de historia general, saludos, respuesta social, resumen operativo y proveedor real. Crea y elimina empleados temporales de prueba.

Referencias: [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [OWASP Sensitive Information Disclosure](https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/), [OWASP Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/), [OpenRouter Structured Outputs](https://openrouter.ai/docs/guides/features/structured-outputs), [OpenRouter Privacy Controls](https://openrouter.ai/docs/guides/get-started/sovereign-ai).
