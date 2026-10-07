# Login: primera entrada

La pantalla remasteriza la referencia de Interbank: cabecera verde con marca y menú, DNI junto al número de documento, usuario, contraseña, ingreso, recuperación y creación de usuario. El formulario admite desplazamiento para pantallas compactas y teclado abierto; respeta las áreas seguras del dispositivo.

## Responsabilidades

- `LoginScreen` compone el formulario y coordina la ayuda visual.
- `LoginScaffold` contiene la cabecera, el fondo y la distribución adaptable.
- `LoginDocumentField` presenta el único documento admitido por el contrato actual: DNI de 8 dígitos.
- `AuthInput` conserva su variante original para el ingreso de dispositivos registrados y añade una variante de login con estados de foco y error.
- `LoginHelpSheet` presenta menú, ayuda para recordar usuario, recuperación y registro.
- `useLogin` conserva la integración con `AuthProvider` y el caso de uso existente; valida los campos antes de enviar y evita solicitudes simultáneas por doble pulsación.
- `useAuthAccessibility` observa preferencias de transparencia y movimiento mediante APIs nativas y media queries en web.

El campo visual **Usuario** sigue enviando `email` a `POST /auth/login`. No admite alias arbitrarios: el servicio exige un correo registrado. La contraseña permanece oculta inicialmente y no se almacena en la pantalla ni en la ayuda.

## Material y accesibilidad

Se reutiliza `LiquidGlassSurface`, el componente de Home, únicamente en el menú. Recuperar acceso es un enlace de texto subrayado que abre la ayuda existente, sin fondo ni borde de botón. Los campos y el panel de ayuda usan fondos opacos; no se apilan superficies de vidrio. El efecto combina blur, reflejos y tintes discretos. Es una adaptación visual multiplataforma, no el material nativo de Apple ni una implementación de su refracción óptica.

Al reducir transparencia, esos controles usan un fondo opaco. Al reducir movimiento, la ayuda se abre sin animación. Los controles principales y el botón de visibilidad tienen áreas táctiles de al menos 44 puntos. Los errores aparecen al abandonar un campo y el ingreso se habilita con DNI, correo y contraseña válidos.

La cabecera comparte los verdes del tema bancario usado por Home. Ingresar usa `blueAction` (`#2563EB`), equivalente al azul `blue-600` del botón Plinear, incluso cuando el formulario todavía está incompleto; la acción permanece deshabilitada hasta completar datos válidos. Los controles del login usan estilos estáticos y `TouchableOpacity` para conservar fondos, bordes y disposición horizontal en el dispositivo nativo. El selector DNI mantiene un ancho de 94 puntos y el campo del número ocupa el espacio restante.

Referencias oficiales consultadas:

- [Apple: Meet Liquid Glass (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/219/): separación entre contenido y controles, legibilidad, evitar vidrio sobre vidrio y preferencias de accesibilidad.
- [Apple: Materials](https://developer.apple.com/design/human-interface-guidelines/materials).

## Alcance de recuperación y registro

La API actual no ofrece endpoints de recuperación de contraseña ni de creación de usuario. Los accesos abren ayuda y explican esta disponibilidad; no simulan restablecimientos ni registros exitosos. Recordar usuario explica que se utiliza el correo registrado. Estos flujos podrán conectarse a casos de uso y servicios propios cuando exista el contrato correspondiente.

## Verificación

Usar `npm run validate` y `npx expo export --platform all`. La revisión visual en web puede usar una respuesta local de salud y credenciales ficticias, manteniendo apagado el backend real. El bundle Android/iOS verifica compilación, pero no sustituye una revisión en Expo Go con teclado, VoiceOver y preferencias de accesibilidad del dispositivo.
