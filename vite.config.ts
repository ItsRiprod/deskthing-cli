import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import viteLegacyPlugin from "@vitejs/plugin-legacy"

export default defineConfig(({ command, mode }) => {

  const isLegacyDev = process.env.LEGACY_DEV === 'true' || mode === 'legacy'

  return {
    plugins: [react(), ...(command === 'build' || isLegacyDev ? [
      viteLegacyPlugin({
        targets: ["Chrome 69"],
        modernPolyfills: true,
        renderLegacyChunks: true
      })
    ] : [])
    ],
    root: 'src/emulator/template',
    server: {
      proxy: {
        '^/config$': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        },
        '^/api/': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      }
    },
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
  }
})