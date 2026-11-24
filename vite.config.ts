import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(rootDir, 'dist');
          const srcAssets = path.resolve(rootDir, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, { recursive: true, force: true });
          }
        },
      },
      // Strips the raw-source GitHub Pages redirect script from built HTML
      // and mirrors dist/ -> docs/ so GitHub Pages works under ALL 3 modes:
      // (1) GitHub Actions, (2) Branch -> /docs, and (3) Branch -> / (root).
      {
        name: 'github-pages-compat',
        apply: 'build',
        transformIndexHtml(html: string): string {
          return html.replace(
            /\s*<!--\s*GitHub Pages root fallback[\s\S]*?<script\s+data-gh-pages-fallback>[\s\S]*?<\/script>/i,
            ''
          );
        },
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(rootDir, 'dist');
          const docsDir = path.resolve(rootDir, 'docs');
          if (fs.existsSync(distDir)) {
            fs.rmSync(docsDir, { recursive: true, force: true });
            fs.cpSync(distDir, docsDir, { recursive: true, force: true });
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
