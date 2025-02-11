#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Banner for the CLI
console.log(`
------------------------------------------------
      _           _    _   _     \x1b[32m_\x1b[0m             
     | |         | |  | | | |   \x1b[32m(_)\x1b[0m            
   __| | ___  ___| | _| |_| |__  _ _ __   __ _ 
  / _\` |/ _ \\/ __| |/ / __| '_ \\| | '_ \\ / _\` |
 | (_| |  __/\\__ \\   <| |_| | | | | | | | (_| |
  \\__,_|\\___||___/_|\\_\\\\__|_| |_|_|_| |_|\\__, |
                                          __/ |
                                         |___/  

---------- dev -- template -- update -----------
     `)
yargs(hideBin(process.argv))
  .scriptName('deskthing')
  .command('dev', 'Start development server', (yargs) => {
    return yargs.option('port', {
      type: 'number',
      default: 8891,
      description: 'Port for WebSocket server'
    })
  }, async (argv) => {
    console.log('Starting development server...')
    // Install tsm if not already installed
    execSync('npm install tsm --no-save', { stdio: 'inherit' })
    
    const indexPath = join(__dirname, './index.js')
    const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`
    const { startDevelopment } = await import(fileUrl)
    await startDevelopment({ port: argv.port })
  })
  .command('update', 'Update dependencies and configurations', (yargs) => {
    return yargs.option('force', {
      type: 'boolean',
      default: false,
      description: 'Force update all dependencies'
    })
  }, async (argv) => {
    console.log('Updating dependencies and configurations...')
    const indexPath = join(__dirname, './index.js')
    const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`
    const { runUpdate } = await import(fileUrl)
    await runUpdate({ force: argv.force })
  })
  .command('template', 'Setup the DeskThing template', (yargs) => {
    return yargs
  }, async () => {
    console.log('Setting up the DeskThing template...')
    execSync('npm create deskthing@latest', { stdio: 'inherit' })
  })
  .parse()