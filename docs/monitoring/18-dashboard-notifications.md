# Notificaciones internas del dashboard

Rama `feat/notifications`, creada desde develop después del merge de la API
(PR #9, `68c33d6`). El cambio integra los seis puntos del primer avance de la
bandeja, manteniendo el layout y los componentes existentes.

## Comportamiento

| Parte | Implementación |
| --- | --- |
| Campana | En la barra superior; exige notifications.read e incidents.read, igual que la API. No monta consultas sin ambos permisos. |
| Conteo | GET /notifications/unread-count. No se calcula a partir de la página visible; soporta más de 100 sin leer. Badge 99+ y cifra exacta en panel/etiqueta accesible. |
| Panel | Servicio, descripción, fecha PET, estado de lectura y estado/severidad actuales del expediente. El resumen del incidente procede de la respuesta agrupada de la API. |
| Navegación | Ver expediente usa /incidents/:id y conserva el query string actual. Abrir un expediente no marca el aviso como leído. |
| Lectura | PATCH /notifications/:id/read. Después de confirmar acknowledged, invalida bandeja y contador. No inventa readAt ni decrementa contadores con datos anteriores. |
| Actualización | React Query cada 10 segundos en primer plano. La bandeja solo consulta mientras está abierta; no se crea otro socket ni se refresca la aplicación completa. |

Se reutilizan el cliente Axios autenticado y su renovación de sesión, React Query,
Button, etiquetas del módulo de incidentes y Radix ya instalado. Se añade un
wrapper pequeño de Popover siguiendo los componentes UI existentes. No se añaden
dependencias, endpoints, tablas, otra página ni otro gestor de estado.

Se retiraron los badges numéricos fijos del sidebar que estaban etiquetados como
notificaciones sin consumir datos. No se reemplazaron por números estimados.

## Paginación y rendimiento

La bandeja solicita páginas de 20 y ofrece Cargar más. React Query conserva hasta
cinco páginas en memoria y elimina la más antigua de la ventana al avanzar; el
usuario puede seguir consultando páginas anteriores. Cuando se deja atrás la
primera página aparece Ver recientes para reiniciar desde el principio. El orden
es el de la API y se deduplican IDs al representar la lista.

Las lecturas HTTP usan AbortSignal para cancelar peticiones al desmontar/cambiar
de empleado. Las claves incluyen el ID del empleado, sin tokens. Al desmontar se
cancelan consultas y se eliminan las entradas inactivas de esta bandeja. Los
contadores y la lista comparten caché por identidad; no se utiliza keepPreviousData
para mostrar resultados de otra cuenta.

Se fija un timeout de 10 segundos únicamente en las peticiones de notificaciones,
sin cambiar el cliente global. No se reintentan mutaciones automáticamente; si
una respuesta se pierde, el operador puede repetir la lectura idempotente.

## Estados

- Carga inicial: indicador de conteo desconocido y skeletons estáticos al abrir.
- Vacío: solo tras una respuesta correcta; nunca como sustituto de un fallo.
- Error/transporte: indicador de conteo no disponible, información anterior
  identificada como posiblemente desactualizada y acción Reintentar.
- Sin conexión: conserva caché, suspende acciones de escritura y no presenta el
  contador almacenado como actual. React Query reanuda al recuperar conexión.
- Deshabilitado: reconoce el 503 específico del contrato actual, también después
  de que el interceptor lo transforme en ApiError. Un 503 genérico sigue siendo
  un fallo temporal, no una funcionalidad deshabilitada.
- 401/403: mensaje de sesión/permisos, suspensión del sondeo automático de la
  fuente rechazada y ocultación del contenido cacheado cuando el acceso se deniega.
- API ausente: 404 con mensaje específico, sin fingir una bandeja vacía.
- Cursor vencido: permite reiniciar desde los avisos recientes.
- Referencia de incidente ausente: conserva la notificación y no crea un enlace roto.

Marcar como leída no reconoce una alerta, no asigna ni cierra un incidente. El
panel lo indica expresamente. Los avisos públicos del incremento 3 siguen siendo
un canal separado.

## Accesibilidad y diseño

Popover de Radix con cierre exterior/Escape y devolución de foco al botón. La
campana y el panel tienen nombres accesibles, el cambio de conteo usa un estado
polite y el contenido tiene una región desplazable enfocada por teclado. Hay
foco visible, estados con texto y fecha PET. El panel adapta su ancho al viewport
y limita el scroll al contenido. Fondo neutro, bordes suaves y acento verde;
sin efectos glass, nuevas animaciones ni reproducción de sonidos.

## Validación y despliegue pendientes

Se prepararon casos de permisos, aislamiento de caché, carga diferida, conteo
superior a 100, espera de confirmación de lectura, navegación con contexto,
referencias ausentes y clasificación de errores normalizados. No se ejecutaron
pruebas, compilaciones, navegador, migraciones ni servicios por la indicación
vigente. La revisión realizada es estática; falta validar responsive, teclado,
paginación prolongada, entrega real y recuperación de red en ejecución.

Para visualizar este código hay que reconstruir la imagen del dashboard o usar
Vite desde esta rama. El backend debe incluir los endpoints del PR #9 y tener
MONITORING_DELIVERY_ENABLED=true; no se editó el .env ni se activó el worker en
este avance. La migración de índices de la API permanece pendiente de aplicación.

Las correcciones de configuración local/Supabase siguen en
codex/fix-local-development-environment y no están en develop; este cambio no las
duplica ni modifica destinos de base de datos. Integrarlas por separado antes de
reconstruir ese despliegue para conservar su configuración remota.
