# Migración a Expo SDK 57

## Motivo

Expo Go en dispositivos iOS solo admite el SDK estable actual. La aplicación estaba en SDK 54 y Expo Go instalado requería SDK 57, por lo que ambos runtimes no podían abrir el mismo bundle.

## Estrategia aplicada

La actualización se realizó incrementalmente (`54 → 55 → 56 → 57`) siguiendo la guía oficial de Expo. En cada salto, `expo install --fix` alineó los módulos nativos con el SDK correspondiente. El proyecto usa Continuous Native Generation y no conserva carpetas `android` o `ios` generadas.

Versiones principales resultantes:

- Expo SDK 57
- React Native 0.86.3
- React 19.2.3
- TypeScript 6.0.3
- Node.js 22.18.0 mediante `.nvmrc`

## Decisiones técnicas

- Se mantuvo `App.tsx` como punto de entrada.
- Se retiró `expo-router` porque la aplicación usa React Navigation y mantener ambos sistemas hacía que Expo interpretara `src/app` como rutas.
- La capa de composición se renombró a `src/application` para no colisionar con la convención reservada `src/app` de Expo Router.
- Se retiró `lottie-react-native` porque no se utilizaba y su peer opcional de Windows bloqueaba la resolución limpia de React Native 0.86.
- Se retiró Google Sign-In porque no se utiliza en el flujo actual y Expo Go no incluye ese módulo nativo; deberá incorporarse con un development build cuando exista un caso de uso aprobado.
- Se actualizó Axios a una versión parcheada posterior a `1.15.1`.
- Se añadió `@react-navigation/native-stack`, utilizado directamente por los navegadores.
- Se añadió `@types/node` para tipar explícitamente `process.env`.
- Se reemplazó el archivo generado `expo-env.d.ts` por declaraciones estables en `src/types/expo.d.ts`.
- Se adaptaron efectos, referencias y Shared Values a las reglas de React Compiler incluidas con React 19.2.
- Se retiraron `newArchEnabled` y `android.edgeToEdgeEnabled`: en SDK 57 ya no son opciones configurables y Expo Doctor las rechaza.

## Validación requerida

Antes de integrar futuros cambios se debe ejecutar:

```powershell
npm ci
npm run validate
npx expo-doctor
npx expo export --platform web
```

Referencias:

- https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/
- https://expo.dev/changelog/sdk-55
- https://expo.dev/changelog/sdk-56
- https://expo.dev/changelog/sdk-57
