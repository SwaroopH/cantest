import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project site: https://swarooph.github.io/cantest/
  base: '/cantest/',
  plugins: [react()],
})
