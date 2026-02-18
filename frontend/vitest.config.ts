import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 75,
      },
      exclude: [
        'node_modules/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.config.*',
      ],
    },
  },
})
