# Interfaz de registro

Rama `feature/screen-register`, creada directamente desde `develop`. Como `develop` aún contiene la base móvil anterior, se incorporó únicamente `interbank-mobile` desde `main` para reutilizar el diseño actual. No se modificó el backend ni las ramas previas.

## Diseño y navegación

“Crear usuario” en el login abre `Register` dentro de `AuthNavigator`. El flujo conserva la tipografía, paleta verde y azul, campos del login y vidrio suave del control de regreso y del botón principal. Se contemplan áreas seguras, teclado, desplazamiento sin rebote y reducción de transparencia y movimiento.

La pantalla inicial sigue la referencia: progreso segmentado, título centrado, selección de DNI, número de documento, consentimiento, botón y ayuda. Los componentes `LoginDocumentField` y `AuthInput` se reutilizan; la opción de ocultar la etiqueta del documento conserva el comportamiento anterior para el login.

## Pasos

1. Documento: DNI de 8 dígitos y aceptación de la información de privacidad.
2. Contacto: correo electrónico y celular peruano de 9 dígitos que comience con 9.
3. Código de correo: destino enmascarado, seis espacios visuales para el código, cambiar correo y solicitar código. El envío todavía no existe; “Ver siguiente paso” recorre únicamente la vista previa.
4. Identidad: preparación para una selfie, guía de iluminación y rostro descubierto, y ayuda contextual. No se abre la cámara ni se captura una fotografía.
5. Acceso digital: usuario, contraseña y confirmación, con requisitos visibles que se actualizan al escribir.
6. Revisión: documento, contacto y usuario, con acciones para corregirlos. Correo e identidad aparecen pendientes de verificación.
7. Cierre: confirma que la vista previa ha terminado e invita a volver al login. No muestra “Usuario creado” ni inicia sesión.

La navegación hacia atrás conserva los datos no secretos. Las contraseñas se descartan al pasar a revisión, retroceder, editar desde revisión o poner la app en segundo plano. Si se vuelve al paso de seguridad deben ingresarse nuevamente. Todo el borrador existe únicamente en el estado de React y desaparece al salir de la ruta. No se almacena en Secure Store, AsyncStorage, localStorage, logs ni parámetros de navegación.

## Investigación y decisiones de diseño — 18 de octubre de 2026

Se consultaron fuentes oficiales de Interbank:

- [Registro en Interbank APP](https://interbank.pe/centro-de-ayuda/banca-digital/como-me-registro-en-interbank-app): explica el acceso al registro y remite a un tutorial, sin describir todas las pantallas en texto.
- [Interbank APP](https://interbank.pe/canales-digitales/interbank-app): documenta selfie para identidad, recomendaciones de iluminación, código de verificación y recuperación de accesos si ya existe registro. También menciona requisitos de tarjeta activa. Estos requisitos no se comprueban en esta interfaz.
- [Banca por Internet](https://interbank.pe/canales-digitales/banca-por-internet): referencia para usuario digital y contraseña de los canales digitales.
- [Términos de canales digitales, septiembre de 2024](https://content-us-2.content-cms.com/9b3f67ef-5a9f-4acc-8ce8-bcc27fa681c7/dxdam/38/3875736e-b8ff-4a2f-8db2-b9078d272da6/TyC%20Canales%20Digitales%20%28set%202024%29%20VF.pdf): antecedente para activación y validación biométrica. Es un documento fechado; no se toma como prueba de la secuencia actual de pantallas ni como política aplicable a este proyecto.

Las fuentes confirman elementos del registro, pero no proporcionan capturas completas y actuales de cada paso. El orden exacto, seis casillas de código, textos y composición son una propuesta de diseño del proyecto. No se copian reglas de Interbank Negocios ni de Interbank Benefit: son productos distintos.

El usuario local admite 6–20 caracteres alfanuméricos. La contraseña admite 8–128 caracteres, requiere letras y números, no debe contener el DNI ni coincidir con el usuario. Estas son reglas propuestas para la interfaz, no una afirmación de la política vigente de Interbank. El teléfono peruano y la longitud del documento también son límites del prototipo actual.

No se agregan campos de tarjeta, CVV o clave de cajero. La elegibilidad del cliente y la identidad deberán resolverse mediante servicios específicos cuando exista el contrato de registro.

## Contrato pendiente

El backend actual tiene login y login de dispositivo, pero no un endpoint de registro o verificación de identidad. Esta entrega implementa únicamente las pantallas. No envía datos, no genera OTP, no comprueba que el DNI exista ni que el teléfono o el correo pertenezcan al usuario y no crea usuarios.

“Finalizar vista previa” conduce al cierre del recorrido local. Los pasos de correo e identidad usan `continuePreview`, separado de `next`; no guardan indicadores de correo verificado, identidad validada o usuario creado. Antes de habilitar un registro real deben sustituirse estas transiciones por desafíos y resultados autorizados por el servidor.

Faltan contratos de elegibilidad del DNI, envío/reenvío/verificación de códigos con caducidad y límites, validación de documento y selfie con prueba de vida, disponibilidad de usuario, creación de credenciales, consentimiento versionado y resultado final. El registro no se conectará al login hasta que el servidor confirme el alta. El login actual continúa usando correo y contraseña; el campo nuevo de usuario digital todavía no cambia ese contrato.

El enlace inicial abre “Información de privacidad” y describe el tratamiento real del borrador en esta vista previa. No se presenta la política de Interbank como si cubriera esta aplicación simulada.

## Capas

Los enums, borrador y validaciones locales están en `domain/registration`; `useRegistration` administra pasos, edición, validación local y descarte de secretos. `RegisterScreen` compone los componentes independientes de contacto, código, identidad, credenciales, revisión y cierre. `RegistrationScaffold` centraliza encabezado, áreas seguras, desplazamiento, progreso y pie. `RegistrationSheet` contiene ayudas por contexto y `RegistrationNotice` comunica las funciones aún no habilitadas. El botón azul se reutiliza desde `shared/components/BankingActionButton`.

No se ejecutaron pruebas ni compilaciones, por indicación del usuario.
