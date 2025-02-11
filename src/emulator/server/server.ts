import { FSWatcher, watch as fsWatch } from 'fs'
import { ChildProcess, fork } from 'child_process'
import { Logger } from '../services/logger'

import { handleDataFromApp } from './coms'

import { AppManifest, getManifestDetails } from './manifestDetails'
import { ServerMessageBus } from './serverMessageBus'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

export class ServerRunner {
  private serverProcess: ChildProcess | null = null
  private watcher: FSWatcher | null = null
  private manifest: AppManifest | null = null
  private restartTimeout: NodeJS.Timeout | null = null

  async start() {
    Logger.debug('Starting server wrapper...')
    this.startServerProcess()
    this.watchWithFsAPI()
    this.manifest = getManifestDetails()
    this.startServerMessageBus()
  }

  private startServerMessageBus() {
    ServerMessageBus.initialize(8080)
    ServerMessageBus.subscribe('app:data', (payload) => {
      if (this.serverProcess) {
        this.serverProcess.send({ type: 'app:data', payload: payload })
      }
    })
  }

  private async startServerProcess() {
    Logger.debug('Starting server process...')
    try {
      const projectRoot = process.cwd();
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const processPath = resolve(__dirname, 'serverProcess.ts');
      const serverPath = resolve(projectRoot, 'server', 'index.ts');

      // this.serverProcess = spawn('node', [
      //   '-r', 'ts-node/esm',
      //   '--experimental-specifier-resolution=node',
      //   '--experimental-json-modules',
      //   processPath
      // ], {
      //   env: { 
      //     ...process.env,
      //     SERVER_INDEX_PATH: serverPath,
      //     NODE_OPTIONS: '--experimental-specifier-resolution=node'
      //   },
      //   stdio: ['inherit', 'inherit', 'inherit', 'ipc']
      // })

      this.serverProcess = fork(processPath, [], {
        execArgv: ['--loader', 'tsm'],
        env: { 
          ...process.env,
          NODE_ENV: 'development',
          SERVER_INDEX_PATH: serverPath
        },
        stdio: ['inherit', 'inherit', 'inherit', 'ipc']
      })

      process.env.SERVER_INDEX_PATH = serverPath
      
      Logger.debug('Resolved processPath:', processPath);

      this.serverProcess.on("message", (message: { type: string; payload?: any }) => {
        if (message.type === "server:log" && message.payload) {
          Logger.log("[childprocess]", message.payload);
        } else if (message.type === "server:data") {
          // handle data from the deskthing
          handleDataFromApp(this.manifest?.id || "testapp", message.payload);
        } else {
          Logger.error("Unknown message type:", message.type);
        }
      });


      Logger.log('Server process started')
    } catch (error) {
      Logger.error('Server process failed to start: ', error)
    }
  }

  private watchWithFsAPI() {
    let isInitialScan = true
    const projectRoot = process.cwd()
    const serverPath = resolve(projectRoot, 'server')
    
    this.watcher = fsWatch(serverPath, { recursive: true }, 
      (eventType, filename) => {
        if (filename?.endsWith('.ts')) {
          if (isInitialScan) return
          Logger.log(`File ${filename} changed, queuing server restart...`)
          this.queueRestart()
        }
    })

    setTimeout(() => {
      isInitialScan = false
    }, 1000)
  }

  async stop() {
    this.watcher?.close()
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout)
      this.restartTimeout = null
    }
    if (this.serverProcess) {
      this.serverProcess.kill()
      this.serverProcess = null
    }
  }

  private queueRestart() {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout)
    }
    this.restartTimeout = setTimeout(() => {
      this.restartServer()
      this.restartTimeout = null
    }, 750)
  }

  private async restartServer() {
    Logger.log('Restarting server...')
    if (this.serverProcess) {
      this.serverProcess.kill()
      this.serverProcess = null
    }
    this.startServerProcess()
  }
}