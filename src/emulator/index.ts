import { initConfig } from '../config/deskthing.config'
import { DevClient } from './client/client'
import { ServerRunner } from './server/server'
import { Logger } from './services/logger'
import { TimeService } from './services/timeService'
import { ViteDevServer } from './vite/viteDev'
export async function startDevelopment({ debug, vite }: { debug?: boolean, vite?: boolean } = { debug: false, vite: false }) { 
  if (debug) console.log("Debug mode enabled")
  if (vite) console.log("Vite mode enabled")

  await initConfig({ debug })
  const devServer = new DevClient()
  const serverRunner = new ServerRunner()
  const timeService = new TimeService()
  
  const services = [
    devServer.start(),
    serverRunner.start(),
    timeService.start()
  ]

  // Conditionally start Vite dev server
  if (vite) {
    const viteServer = new ViteDevServer()
    services.push(viteServer.start())
    
    // Handle graceful shutdown
    const cleanup = async () => {
      Logger.info('Shutting down development servers...')
      await viteServer.stop()
      process.exit(0)
    }

    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught exception:', error)
      cleanup()
    })
  }

  await Promise.all(services)
}

// Only run if directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  startDevelopment()
}