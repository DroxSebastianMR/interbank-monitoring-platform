import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const input: Record<string, string> = {
    status: fileURLToPath(new URL('./status.html', import.meta.url)),
  };
  if (mode !== 'status') input.dashboard = fileURLToPath(new URL('./index.html', import.meta.url));
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { host: '0.0.0.0', port: 5173 },
    build: { rollupOptions: { input } },
  };
});
