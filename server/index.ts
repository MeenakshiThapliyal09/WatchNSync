import { createServer } from 'node:http'
import { app } from './app.js'
import { configureSocketServer } from './socket.js'

const fallbackPort = 3000
const configuredPort = Number.parseInt(process.env.PORT ?? `${fallbackPort}`, 10)
const port = Number.isFinite(configuredPort) ? configuredPort : fallbackPort
const host = process.env.HOST ?? '0.0.0.0'

const httpServer = createServer(app)
configureSocketServer(httpServer)

httpServer.listen(port, host, () => {
  console.info(`WatchNSync server listening on http://${host}:${port}`)
})
