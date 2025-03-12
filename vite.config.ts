import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src/emulator/template',
  build: {
    emptyOutDir: true,
    outDir: 'dist/emulator',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/emulator/template/index.html')
      },
      output: {
        // Preserve directory structure
        assetFileNames: 'assets/[name].[ext]',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        dir: 'dist/emulator/template',
      }
    }
  },
  publicDir: './src/emulator/template/public'
})