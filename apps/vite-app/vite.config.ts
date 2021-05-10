import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const port = 8083
// https://vitejs.dev/config/
export default defineConfig({
  base: '/vite-app/',
  server: {
    port,
  },
  plugins: [
    vue(),
  ]
})
