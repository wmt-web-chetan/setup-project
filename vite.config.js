import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import PluginObject from 'babel-plugin-react-compiler';


// https://vite.dev/config/
export default defineConfig({
  plugins: [[PluginObject],  react()],
  server: {
    port: 8080,
  },
})