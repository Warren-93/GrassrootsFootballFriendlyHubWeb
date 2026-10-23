/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mockApi } from './mock/mockApi.ts'

// https://vite.dev/config/
// `npm run dev:mock` (mode "mock") answers the API calls from sample data in
// mock/mockApi.ts instead of a real API, for previewing screens locally.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'mock' ? [mockApi()] : [])],
  ...(mode === 'mock' ? { define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/') } } : {}),
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
}))
