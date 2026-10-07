# Ingreso del dispositivo registrado

La pantalla reutiliza la paleta de Home y el botón azul con reflejos de vidrio del primer ingreso. El saludo utiliza el usuario recordado. El contenido admite desplazamiento, teclado y áreas seguras; la preferencia de reducir transparencia desactiva las capas translúcidas.

## Acceso por plataforma

- Android ofrece contraseña y activación voluntaria de huella digital cuando existe biometría fuerte compatible y configurada.
- iOS presenta Face ID y permite ingresar con contraseña. Si Face ID todavía no está activado, solicita consentimiento y validación de contraseña antes de habilitarlo.
- La biometría no se solicita automáticamente al montar la pantalla. El usuario inicia cada operación.
- El sistema operativo controla el diálogo biométrico. La contraseña de la app permanece como alternativa.

## Responsabilidades

- `DeviceLoginScreen` compone la interfaz; `DeviceLoginScaffold`, `DeviceLoginQuickAccess` y `DeviceBiometricControl` encapsulan sus secciones.
- `useDeviceLogin` coordina modos de ingreso, consentimiento, estado y mensajes.
- `biometric-login.usecase` vincula el usuario y el dispositivo con la autenticación del backend.
- `biometric-login.service` consulta capacidades y administra el almacenamiento nativo protegido.
- `AuthProvider` persiste la sesión validada por la API y permite activar biometría después de un ingreso correcto con contraseña.

## Credencial y contrato actual

`POST /auth/device-login` exige contraseña, identificador del dispositivo y session token. Por ello, esta integración guarda la contraseña únicamente con consentimiento, en Secure Store nativo con `requireAuthentication` y `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. No guarda esa credencial en web ni en AsyncStorage.

La lectura exige autenticación del sistema. Después del desbloqueo, la API vuelve a validar el ingreso; el resultado debe corresponder al usuario y al dispositivo vinculados. Cambiar la biometría puede invalidar el secreto y exige volver a activar el acceso con contraseña. Cambiar de cuenta o bloquear el acceso local elimina la credencial biométrica y los datos de sesión recordados.

Para evolucionar a un protocolo sin contraseña almacenada, el backend debe incorporar una credencial de dispositivo y desafíos firmados. La biometría local por sí sola no autoriza una sesión bancaria.

## Alcance de los accesos

“Bloquear” desvincula el acceso local de este teléfono después de confirmación; no bloquea tarjetas ni cuentas en el servidor. El siguiente ingreso requiere los datos completos.

QR personal y Plinear por WhatsApp se presentan como próximos y muestran información al pulsarlos. No se genera un QR de pago simulado ni se integra un servicio externo.

## Requisitos nativos

Se incorporó `expo-local-authentication` y los permisos de Face ID en los plugins de Expo. Face ID no está disponible en Expo Go para iOS: requiere una versión nativa de desarrollo o instalada que incluya estos plugins y permisos. Android también requiere biometría configurada y almacenamiento protegido compatible.

Referencia: [Expo LocalAuthentication, SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/local-authentication/).

No se ejecutaron pruebas ni compilaciones para estos cambios, por indicación del usuario.
