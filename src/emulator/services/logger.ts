
import { serverConfig } from '../config/server.config'

export enum LOGGING_LEVELS {
  MESSAGE = "message",
  LOG = "log",
  WARN = "warning",
  ERROR = "error",
  DEBUG = "debugging",
  FATAL = "fatal"
}

export class Logger {
  private static prefix = serverConfig.logging.prefix
  
  static log(...args: any[]): void {
    if (serverConfig.logging.level === 'debug') {
      console.log(this.prefix, ...args)
    } else {
      console.log(this.prefix, args[1])
    }
  }
  
  static debug(...args: any[]): void {
    if (serverConfig.logging.level === 'debug') {
      console.debug('\x1b[36m%s\x1b[0m', this.prefix, ...args)
    }
  }
  
  static error(...args: any[]): void {
    console.error(this.prefix, ...args)
  }
  
  static table(data: any): void {
    console.table(data)
  }

  static clientLog(type: LOGGING_LEVELS, message: string): void {
    const prefix = `[App ${type.trim()}] `
    switch (type) {
      case LOGGING_LEVELS.LOG:
        console.log('\x1b[90m%s\x1b[0m', prefix + message); // Gray
        break
      case LOGGING_LEVELS.ERROR:
        console.log('\x1b[31m%s\x1b[0m', prefix + message); // Red
        break
      case LOGGING_LEVELS.WARN:
        console.log('\x1b[33m%s\x1b[0m', prefix + message); // Yellow
        break
      case LOGGING_LEVELS.MESSAGE:
        console.log('\x1b[32m%s\x1b[0m', prefix + message); // Green
        break
      case LOGGING_LEVELS.DEBUG:
        console.log('\x1b[36m%s\x1b[0m', prefix + message); // Cyan
        break
      default:
        console.log('[CLIENT LOGGING: ]', type, message)
    }
  }}
