# Pantalla de pago de servicios

Rama: `feature/screen-payment-service`, creada desde `develop`. La base móvil de `main` se incorporó únicamente en `interbank-mobile` porque `develop` todavía contenía la aplicación anterior. No se modificó el backend.

## Diseño

Se reutilizan `BANKING_COLORS` y `LiquidGlassSurface`. A partir de las referencias visuales del usuario, el encabezado verde contiene el buscador y tiene esquinas inferiores redondeadas. El banner azul de “Programa tus pagos” se superpone al borde verde y utiliza un reflejo suave, con una ilustración de calendario construida con componentes nativos.

El encabezado completo y el contenido comparten un único desplazamiento vertical: buscador, fondo y borde inferior se mueven juntos. El banner de programación es compacto. Los frecuentes se presentan como una sección plana con separadores entre servicios, sin contenedor de tarjeta; si no existen registros, solo se muestra “no hay pagos frecuentes todavia” debajo del título.

Los rubros aparecen como filtros horizontales. La entrada incluye “Te recomendamos pagar” con cuatro empresas activas del catálogo y “Tus servicios frecuentes” con datos del backend. Las empresas se presentan en dos columnas. Los logos utilizan `logoUrl` cuando existe y siglas cuando falta o falla la imagen. La confirmación conserva el total destacado, el detalle del recibo y la cuenta de cargo.

El banner de programación abre una hoja informativa que indica que la función estará disponible próximamente. No crea cobros automáticos ni recordatorios. Su presentación no implica que exista un contrato de programación en el backend.

La pantalla contempla áreas seguras, teclado, desplazamiento sin rebote, ancho máximo para pantallas grandes y reducción de transparencia. Se accede desde Home y desde la pestaña “Servicios”, que reemplaza la etiqueta anterior “Beneficios” asociada al mismo destino.

Se tomaron como referencia la organización por rubros y empresas de Interbank y el acceso directo a recibos de BBVA. Los pagos utilizan los contratos de servicios del proyecto, sin incorporar reglas o límites de transferencias de Plin.

## Flujo y arquitectura

1. Buscar empresas y filtrar por categorías del backend. La búsqueda espera 300 ms y cancela solicitudes anteriores.
2. Seleccionar un convenio e ingresar su referencia según los límites y patrón del catálogo.
3. Consultar y seleccionar un recibo, o ingresar un importe en convenios que no consultan deuda.
4. Revisar cuenta de cargo, moneda, importe, comisión y total antes de confirmar.
5. Mostrar la constancia devuelta por la API, sin simular resultados exitosos.

Los componentes se encuentran en `modules/payments/components`, la coordinación en `useServicePayments`, los tipos y validaciones en `domain/payments` y el transporte en `infrastructure/api/payments`. Se reutilizan Axios autenticado y el caso de uso de Home para las cuentas.

`usePaymentHome` carga los accesos recomendados y los frecuentes por separado, con cancelación al abandonar el catálogo. Los frecuentes provienen de `GET /service-payments/saved`; al abrir uno se resuelve el convenio activo y se completa la referencia guardada. Después de un pago completado, `SaveFrequentService` permite asignar un nombre y guardar con `POST /service-payments/saved`. Al regresar al catálogo se actualiza la sección. Los estados vacíos y de error no se sustituyen con registros ficticios.

Las operaciones monetarias de validación usan centavos enteros. El backend sigue siendo la autoridad para disponibilidad de cuentas, saldos, recibos y ejecución. Se paga el importe completo del recibo; esta interfaz no habilita pagos parciales aunque el convenio pueda soportarlos.

La confirmación bloquea pulsaciones simultáneas y usa `Idempotency-Key`. Ante una respuesta ambigua conserva la misma clave y el mismo cuerpo para reintentar durante la sesión de esta pantalla. Esta versión no persiste operaciones pendientes después del cierre del proceso; la recuperación durable requiere una siguiente integración de almacenamiento e historial. Ante un rechazo confirmado se permite corregir los datos.

## Referencias

- [Rubros de pago de servicios en Interbank APP](https://interbank.pe/canales-digitales/interbank-app/pago-servicios).
- [Servicios y recibos en BBVA](https://www.bbva.pe/personas/servicios-digitales/nueva-banca-movil/paga-tus-servicios-y-otros-recibos.html).

- [Pago de servicios desde Interbank APP](https://interbank.pe/web/guest/centro-de-ayuda/banca-digital/como-realizo-pago-de-servicios-desde-interbank-app).
- [Plin en Interbank](https://interbank.pe/es/centro-de-ayuda/banca-digital/que-es-plin).

En la integración con `develop` se ejecutó `npm run validate` (TypeScript y ESLint). No se ejecutaron pagos reales.
