# Interbank Monitor Mobile

Aplicación móvil bancaria simulada construida con la base técnica validada del proyecto Dali, adaptada a los contratos y módulos de Interbank Monitor. No procesa operaciones financieras reales.

## Stack compatible

- Expo SDK 57 (`expo@57.0.26` instalado en el lockfile)
- React Native `0.86.3`
- React `19.2.3`
- TypeScript `6.0.3`
- NativeWind `4.2.3` y Tailwind CSS `3.4.19`
- React Navigation 7
- Axios, Expo Secure Store, Reanimated y Safe Area Context
- Capacidades instaladas para cámara, ubicación, notificaciones y haptics

La aplicación partió de las versiones probadas en Dali y fue migrada incrementalmente de Expo SDK 54 a 55, 56 y 57. Las dependencias nativas quedaron alineadas con Expo SDK 57 para funcionar con la versión actual de Expo Go. El entorno requiere Node.js 22.13 o superior; el proyecto fija Node `22.18.0` en `.nvmrc`.

## Inicio

```powershell
cd interbank-mobile
Copy-Item .env.example .env
npm ci
npm run start
```

Para Android Emulator, normalmente se usa:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

En un teléfono físico, reemplaza la URL por la IP local del equipo que ejecuta el backend. En web puede mantenerse `http://localhost:3000`.

## Comandos

```powershell
npm run start
npm run android
npm run ios
npm run web
npm run typecheck
npm run lint
npm run validate
```

## Arquitectura

La entrada es `App.tsx`; no se utiliza routing basado en archivos. React Navigation es el único sistema de navegación y separa autenticación y aplicación. La organización sigue capas explícitas:

```text
src/
├── application/      composición, providers, navegación y runtime
├── config/           configuración estable y variables públicas
├── domain/           casos de uso sin detalles de interfaz
├── infrastructure/   HTTP, almacenamiento y servicios del dispositivo
├── modules/          funcionalidades y pantallas por dominio bancario
└── shared/           componentes y utilidades reutilizables
```

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el detalle de responsabilidades y contratos, y [docs/EXPO_SDK_57_MIGRATION.md](docs/EXPO_SDK_57_MIGRATION.md) para las decisiones y comprobaciones de la actualización.
