import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    server: {
      host: '::',
      port: '8081',
      hmr: {
        overlay: false,
      },
    },
    plugins: [react()],
    resolve: {
      alias: [
        {
          find: '@',
          replacement: path.resolve(__dirname, './src'),
        },
        {
          find: 'lib',
          replacement: path.resolve(__dirname, './lib'),
        },
      ],
    },
  };
});
