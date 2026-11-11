import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    // Proxy de dev: elimina CORS ao encaminhar pedidos de /auth, /category,
    // /transactions e /report ao backend. Assim o dev funciona sem redeploy do CORS.
    proxy: {
      '/auth': 'https://api.matheuslab.xyz',
      '/category': 'https://api.matheuslab.xyz',
      '/transactions': 'https://api.matheuslab.xyz',
      '/report': 'https://api.matheuslab.xyz',
    },
  },
})