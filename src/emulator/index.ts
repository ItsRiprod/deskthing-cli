import { initConfig } from '../config/deskthing.config'
import { DevClient } from './client/client'
import { ServerRunner } from './server/server'
export async function startDevelopment() { 
  await initConfig()
  
  const devServer = new DevClient()
  const serverRunner = new ServerRunner()
  await Promise.all([
    devServer.start(),
    serverRunner.start()
  ])
}

// Only run if directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  startDevelopment()
}