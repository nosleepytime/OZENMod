import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    // Bake the distributable configuration in at build time so packaged
    // installers can connect without the user setting environment variables:
    // the official Twitch client id (device-code flow, public) and the deployed
    // web app URL used for the desktop→Firebase token exchange. Both default to
    // empty, in which case the app asks the user to connect / disables sync.
    define: {
      'process.env.TWITCH_CLIENT_ID': JSON.stringify(process.env.TWITCH_CLIENT_ID ?? ''),
      'process.env.OZENMOD_WEB_URL': JSON.stringify(process.env.OZENMOD_WEB_URL ?? ''),
    },
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') },
      },
    },
  },
  preload: {
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') },
      },
    },
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/renderer/index.html') },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer'),
      },
    },
    plugins: [react()],
  },
});
