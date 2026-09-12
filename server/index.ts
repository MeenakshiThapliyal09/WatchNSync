import { createServer } from 'node:http'
import { app, configureRoomRoutes } from './app.js'
import { RoomManager } from './rooms/roomManager.js'
import { configureSocketServer } from './socket.js'

const fallbackPort = 3000
const configuredPort = Number.parseInt(process.env.PORT ?? `${fallbackPort}`, 10)
const port = Number.isFinite(configuredPort) ? configuredPort : fallbackPort
const host = process.env.HOST ?? '0.0.0.0'
const roomManager = new RoomManager()

configureRoomRoutes(roomManager)
const httpServer = createServer(app)
configureSocketServer(httpServer, roomManager)

httpServer.listen(port, host, () => {
  console.info(`WatchNSync server listening on http://${host}:${port}`)
})
