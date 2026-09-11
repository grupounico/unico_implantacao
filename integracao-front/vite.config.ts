// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'

const packageJsonPath = path.resolve(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const aiServicesProxyTarget = (
    env.VITE_AI_SERVICES_PROXY_TARGET || 'http://localhost:3100'
  ).replace(/\/+$/, '');

  return {
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    plugins: [
      { enforce: 'pre', ...mdx() },
      react({
        include: /\.(mdx|js|jsx|ts|tsx)$/,
      }),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/ai-services': {
          target: aiServicesProxyTarget,
          changeOrigin: true,
          secure: aiServicesProxyTarget.startsWith('https://'),
          rewrite: (requestPath) => requestPath.replace(/^\/ai-services/, ''),
        },
      },
      fs: {
        allow: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'src/templates'),
          path.resolve(__dirname),
        ],
      },
    },
  };
});
