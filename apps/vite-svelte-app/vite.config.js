import { defineConfig } from 'vite'
import svelte from '@sveltejs/vite-plugin-svelte'
import { name, singleApp } from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'development' ? singleApp.entry : `/${name}/`,
  server: {
    port: 8084,
  },
  plugins: [svelte()]
})
