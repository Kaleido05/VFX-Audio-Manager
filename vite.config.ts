import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// 开发模式：移除 HTML 中的 CSP meta 标签，交给 Electron 主进程的 HTTP 头管理
function stripCspDevPlugin(): Plugin {
  return {
    name: 'strip-csp-dev',
    transformIndexHtml(html) {
      return html.replace(/<meta[^>]*Content-Security-Policy[^>]*\/?>/gi, '');
    },
    apply: 'serve',
  };
}

export default defineConfig({
  plugins: [react(), stripCspDevPlugin()],
  root: 'src',
  base: './',
  publicDir: path.resolve(__dirname, 'public'),
  build: {
    outDir: '../dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
