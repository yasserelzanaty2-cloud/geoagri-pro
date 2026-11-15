import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {viteStaticCopy} from 'vite-plugin-static-copy';

const cesiumSource = 'node_modules/cesium/Build/Cesium';
const cesiumBaseUrl = 'cesiumStatic';

export default defineConfig(() => {
  const base = process.env.BASE_URL || './';

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      viteStaticCopy({
        targets: [
          {src: `${cesiumSource}/Workers/**/*`, dest: cesiumBaseUrl, rename: {stripBase: 4}},
          {src: `${cesiumSource}/Assets/**/*`, dest: cesiumBaseUrl, rename: {stripBase: 4}},
          {src: `${cesiumSource}/Widgets/**/*`, dest: cesiumBaseUrl, rename: {stripBase: 4}},
          {src: `${cesiumSource}/ThirdParty/**/*`, dest: cesiumBaseUrl, rename: {stripBase: 4}},
        ],
      }),
    ],
    define: {
      CESIUM_BASE_URL: JSON.stringify(`${base.endsWith('/') ? base : base + '/'}${cesiumBaseUrl}`),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
