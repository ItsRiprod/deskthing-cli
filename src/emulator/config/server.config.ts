import { readFileSync } from 'fs'
import { join } from 'path'

const defaultConfig = {
  vite: {
    port: 5173,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173
    },
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  logging: {
      level: 'debug',
      prefix: '[DeskThing Dev]'
    }
}

const getConfigFromFile = () => {
  try {
    const configPath = join(process.cwd(), 'deskthing.emulator.config')
    const configFile = readFileSync(configPath, 'utf-8')
    return JSON.parse(configFile)
  } catch (error) {
    return null
  }
}

export const serverConfig = {
  ...defaultConfig,
  ...getConfigFromFile() || {}
}