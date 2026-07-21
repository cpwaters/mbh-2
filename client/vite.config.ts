import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  // Geolocation (and other privileged browser APIs) require a secure context,
  // which plain HTTP over a LAN IP doesn't satisfy -- only localhost is
  // exempt. This self-signed cert lets phone/LAN testing use HTTPS too.
  plugins: [react(), basicSsl()],
})
