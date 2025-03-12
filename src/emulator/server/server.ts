import { FSWatcher, watch as fsWatch } from 'fs'
import { ChildProcess, fork } from 'child_process'
import { Logger } from '../services/logger'

import { handleDataFromApp } from './coms'

import { AppManifest, getManifestDetails } from './manifestDetails'
import { ServerMessageBus } from './serverMessageBus'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { DeskThingConfig } from '../../config/deskthing.config'
import { LOGGING_LEVELS } from '@deskthing/types'

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
    ServerMessageBus.initialize(DeskThingConfig.development.client.linkPort)
    ServerMessageBus.subscribe('app:data', (payload) => {
      if (this.serverProcess) {
        this.serverProcess.send({ type: 'app:data', payload: payload })
      }
    })
    ServerMessageBus.subscribe('auth:callback', (payload) => {
      if (this.serverProcess) {
        this.serverProcess.send({ type: 'app:data', payload: {
          type: 'callback-data',
          payload: payload.code
        } })
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
      const rootPath = resolve(projectRoot, 'server');
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
      if (this.serverProcess) {
        this.serverProcess.kill('SIGTERM')
        this.serverProcess = null
        Logger.info('Waiting for server to exit...')
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
        this.serverProcess = fork(processPath, [], {
          execArgv: ['--loader', 'tsm'],
          env: { 
            ...process.env,
            NODE_ENV: 'development',
            SERVER_INDEX_PATH: serverPath,
            DESKTHING_ROOT_PATH: rootPath
          },
          stdio: 'pipe'
        })

        this.serverProcess.stdout?.on('data', (data) => {
          Logger.clientLog(LOGGING_LEVELS.LOG, data.toString())
        })

        this.serverProcess.stderr?.on('data', (data) => {
          Logger.clientLog(LOGGING_LEVELS.ERROR, data.toString())
        })

      process.env.SERVER_INDEX_PATH = serverPath
      
      Logger.debug('Resolved processPath:', processPath);

      this.serverProcess.on("message", (message: { type: string; payload?: any }) => {
        if (message.type === "server:log" && message.payload) {
          Logger.debug("[childprocess]", message.payload);
        } else if (message.type === "server:data") {
          // handle data from the deskthing
          handleDataFromApp(this.manifest?.id || "testapp", message.payload);
        } else {
          Logger.error("Unknown message type:", message.type);
        }
      });

      this.serverProcess.on('error', (error) => {
        Logger.error('Experienced an error in the server wrapper:', error)
      })

      this.serverProcess.on('close', (code, signal) => {
        if (signal == 'SIGTERM') {
          return
        }
        
        if (!code || !signal) {
          Logger.warn('server wrapper unexpectedly closed', code, signal)
        }
        if (this.serverProcess) {
          this.serverProcess.kill('SIGTERM')
          this.serverProcess = null
        }
        Logger.debug(`Server process closed with code ${code} and signal ${signal}`)
      })

      Logger.debug('Server process started')
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
          Logger.info(`📝 File ${filename} changed, queuing server restart...`)
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
      this.serverProcess.kill('SIGTERM')
      this.serverProcess = null
    }
  }

  private async queueRestart() {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout)
    }
    this.restartTimeout = setTimeout(() => {
      this.restartServer()
      this.restartTimeout = null
      Logger.info(`🕛 Waited ${DeskThingConfig.development.server.editCooldownMs || 1000}ms. Restarting...`)
    }, DeskThingConfig.development.server.editCooldownMs || 1000)
  }

  private async restartServer() {
    Logger.info('🔄 Restarting server...')
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM')
      this.serverProcess = null
    }
    this.startServerProcess()
  }
}