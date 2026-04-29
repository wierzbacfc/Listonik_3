import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const repoBase = process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : '/';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: repoBase,
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: 'ListoniK',
          short_name: 'ListoniK',
          description: 'Inteligentna lista zakupów',
          start_url: repoBase,
          scope: repoBase,
          id: repoBase,
          display: 'standalone',
          background_color: '#09090b',
          theme_color: '#09090b',
          icons: [
            {
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2309090b'/%3E%3Ctext y='50%' x='50%' font-size='60' text-anchor='middle' dominant-baseline='middle'%3E🛒%3C/text%3E%3C/svg%3E",
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2309090b'/%3E%3Ctext y='50%' x='50%' font-size='60' text-anchor='middle' dominant-baseline='middle'%3E🛒%3C/text%3E%3C/svg%3E",
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
