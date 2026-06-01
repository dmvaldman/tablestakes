import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    host: true, // bind 0.0.0.0 so phones on the same Wi-Fi can reach it
    https: {}, // self-signed cert → secure context (randomUUID / share / clipboard)
  },
})
