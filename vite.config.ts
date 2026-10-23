/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The league fixtures preview runs on sample data instead of the API (see
// src/mock/previewApi.ts): locally with `npm run dev:mock`, and on Vercel for
// this branch's preview deployments only.
const previewMock = (mode: string) => mode === 'mock' || process.env.VERCEL_GIT_COMMIT_REF === 'league-fixtures'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_PREVIEW_MOCK': JSON.stringify(previewMock(mode) ? 'true' : 'false'),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
}))
