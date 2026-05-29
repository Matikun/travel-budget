/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

import { developmentCsp, productionCsp } from './src/lib/csp'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

function productionCspMeta(): Plugin {
  return {
    name: 'production-csp-meta',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (ctx.server) {
          return html
        }

        const meta = `<meta http-equiv="Content-Security-Policy" content="${productionCsp}" />`
        return html.replace('<head>', `<head>\n    ${meta}`)
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), productionCspMeta()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: developmentCsp
    ? {
        headers: {
          'Content-Security-Policy': developmentCsp,
        },
      }
    : undefined,
  preview: {
    headers: {
      'Content-Security-Policy': productionCsp,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
