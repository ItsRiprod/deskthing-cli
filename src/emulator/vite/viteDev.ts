import { join } from 'path'
import { existsSync } from 'fs'
import { DeskThingConfig } from '../../config/deskthing.config'
import { Logger } from '../services/logger'

export class ViteDevServer {
  private server: any = null

  async start(): Promise<void> {
    try {

      const { createServer, defineConfig, loadConfigFromFile } = await import('vite')
      const viteLegacyPlugin = await import('@vitejs/plugin-legacy').then(m => m.default)

      // Base configuration for the emulator
      const baseConfig = defineConfig({
        plugins: [
          viteLegacyPlugin({
            targets: ["Chrome 69"],
            modernTargets: "Chrome 69",
            polyfills: true,
            modernPolyfills: true,
            renderLegacyChunks: true,
            renderModernChunks: false
          })
        ],
        define: {
          'process.env.NODE_ENV': JSON.stringify('development'),
          'process.env.VITE_MODE': JSON.stringify('legacy')
        }
      })

      let finalConfig = baseConfig

      // If user has a vite config, try to merge it
      try {
        const configEnv = { command: 'serve' as const, mode: 'development' }
        const configResult = await loadConfigFromFile(configEnv, undefined, process.cwd())

        if (configResult?.config) {
          Logger.debug('[vite] Found and loaded user vite configuration')
          // Merge configurations, with our base config taking precedence for critical settings
          finalConfig = {
            ...configResult.config,
            plugins: [
              ...(configResult.config.plugins || []),
              viteLegacyPlugin({
                targets: ["Chrome 69"],
                modernTargets: "Chrome 69",
                polyfills: true,
                modernPolyfills: true,
                renderLegacyChunks: true,
                renderModernChunks: false
              })
            ],
          }
          Logger.info('[vite] Successfully merged user vite configuration')
        }
      } catch (error) {
        Logger.warn('[vite] No user vite config found or failed to load, using default configuration')
      }

      console.log('Final Config File: ', finalConfig)

      // Create the Vite dev server
      this.server = await createServer(finalConfig)

      // Start the server
      await this.server.listen()

      const vitePort = DeskThingConfig.development.client.vitePort
      const viteLocation = DeskThingConfig.development.client.viteLocation

      Logger.info(`\x1b[35m⚡ Vite Dev Server running at ${viteLocation}:${vitePort}\x1b[0m`)
      Logger.info(`\x1b[33m🔧 Legacy mode enabled for Chrome 69+ compatibility\x1b[0m`)

      // Print the local and network URLs
      this.server.printUrls()

    } catch (error) {
      Logger.error('Failed to start Vite dev server:', error)
      throw error
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      await this.server.close()
      this.server = null
      Logger.info('Vite dev server stopped')
    }
  }

  getServer() {
    return this.server
  }
}