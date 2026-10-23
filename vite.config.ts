/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The league fixtures preview (see src/mock/previewApi.ts): `npm run dev:mock`
// runs entirely on sample data with no API; this branch's Vercel previews use
// the real API and only fill in the league parts. Off in every other build.
function previewMock(mode: string): string {
  if (mode === 'mock') return 'full'
  if (process.env.VERCEL_GIT_COMMIT_REF === 'league-fixtures') return 'overlay'
  return 'off'
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_PREVIEW_MOCK': JSON.stringify(previewMock(mode)),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
}))
