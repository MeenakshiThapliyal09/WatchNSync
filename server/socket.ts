import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'

export function configureSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  })

  io.on('connection', (socket) => {
    console.info(`Socket connected: ${socket.id}`)

    socket.on('disconnect', (reason) => {
      console.info(`Socket disconnected: ${socket.id} (${reason})`)
    })
  })

  return io
}
