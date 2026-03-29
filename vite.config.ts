import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  const isVercel = process.env.VERCEL === '1'

  return {
    // GitHub Pages requires a repository base path, while Vercel serves from root.
    base: isProduction && !isVercel ? '/hackathon-project-matcher/' : '/',
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
