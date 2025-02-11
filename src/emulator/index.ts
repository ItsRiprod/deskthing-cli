import { DevServer } from './client/client'
import { ServerRunner } from './server/server'
export async function startDevelopment({ port = 8891 }: { port?: number } = {}) { 
  
  const devServer = new DevServer()
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