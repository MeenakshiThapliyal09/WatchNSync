import express from 'express'
import type { RoomManager } from './rooms/roomManager.js'

export const app = express()

app.use((_request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  next()
})

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'WatchNSync server' })
})

export function configureRoomRoutes(roomManager: RoomManager) {
  app.post('/api/rooms', (_request, response) => {
    const room = roomManager.createRoom()
    response.status(201).json({ roomId: room.roomId })
  })
}
