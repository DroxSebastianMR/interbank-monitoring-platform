# Pantallas iniciales de transferencias

## Alcance

Se implementan las dos etapas de las referencias del usuario: elegir el tipo de transferencia y seleccionar o consultar el destino. No se ejecuta `POST /transfers`, no se solicitan importes y no se presenta una constancia de envío.

Desde “Transferir” en Home se abre el stack de aplicación, fuera de las pestañas inferiores. La primera pantalla muestra “Entre mis cuentas” y “A otras cuentas”, con encabezado verde redondeado, filas separadas e iconos con vidrio suave. La segunda utiliza un encabezado claro, contenido desplazable y botón inferior accesible con teclado y áreas seguras.

## Comportamiento

- Entre cuentas propias: consulta `GET /transfers/sources`. El usuario selecciona origen y destino; se excluye la cuenta de origen y se muestran destinos de la misma moneda. No se permite continuar sin ambas cuentas.
- Otras cuentas Interbank: normaliza espacios y guiones y valida el contrato de 10 a 20 dígitos del simulador. “Siguiente” consulta `POST /transfers/beneficiaries/resolve` y muestra los datos devueltos por la API en una hoja inferior.
- Otro banco y exterior: las pestañas muestran que estos flujos estarán disponibles próximamente y deshabilitan “Siguiente”. No se envía un CCI al endpoint de cuentas internas.
- Cambiar número o pestaña cancela la consulta anterior y elimina el resultado obsoleto. Las pulsaciones repetidas no generan consultas simultáneas.
- Se incluyen estados de carga, cuenta no encontrada, errores de red, sesión y límite de consultas. Los datos de titulares no se inventan ni se registran en logs.

La hoja inferior confirma únicamente los datos del destino o las cuentas seleccionadas. La captura de importe y la confirmación de la transferencia corresponden a una siguiente etapa.

## Capas

Los enums y contratos están en `domain/transfers`; los casos de uso normalizan y validan el destino. El transporte reutiliza Axios autenticado en `infrastructure/api/transfers`. `useTransferDestination` coordina consultas, cancelación y selección. Los componentes no implementan reglas financieras.

`BankingFlowScreen` y `BankingActionButton` se agregan a `shared/components` para reutilizar el lenguaje visual en otros flujos. Se reutiliza `LiquidGlassSurface` y se extraen las preferencias de accesibilidad a `shared/hooks/useAccessibilityPreferences`, conservando el export anterior de autenticación para sus consumidores.

## Referencias

- [Transferencias entre cuentas Interbank](https://interbank.pe/es/centro-de-ayuda/banca-digital/como-puedo-realizar-transferencias-entre-mis-cuentas-interbank-desde-interbank-app).
- [Diferencia del CCI para transferencias entre bancos](https://interbank.pe/centro-de-ayuda/envio-y-recepcion-de-dinero/que-es-el-cci).

No se ejecutaron pruebas ni compilaciones, por indicación del usuario.
