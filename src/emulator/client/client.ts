import { createServer } from 'http'
import { readFileSync } from 'fs'
import { join } from 'path'

export class DevServer {
  async start(): Promise<void> {
    const server = createServer((req, res) => {
      // Serve index.html and handle static files
      const html = readFileSync(join(__dirname, '../template/index.html'))
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(html)
    })
    
    server.listen(3000)
  }
}
