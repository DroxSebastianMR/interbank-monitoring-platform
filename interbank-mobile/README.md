# Interbank Mobile

Cliente bancario mínimo y simulado para demostrar la experiencia durante degradaciones o interrupciones. Incluye login, inicio, saldo, transferencia y estado de servicios.

## Ejecutar

Requiere Node 20 y Expo. Copiar `.env.example` a `.env` y ajustar `EXPO_PUBLIC_API_URL` (en Android Emulator suele ser `http://10.0.2.2:8080`). Luego: `corepack enable`, `pnpm install` y `pnpm start`. También están disponibles `pnpm android`, `pnpm ios`, `pnpm web`, `pnpm lint` y `pnpm test`.

La URL está centralizada en `src/config/env.ts`; el móvil solo consume NGINX/App Backend. No usa Docker en esta etapa ni se conecta a la plataforma de monitoreo o sus almacenes.
