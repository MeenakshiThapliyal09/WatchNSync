import { fileURLToPath } from 'node:url'
import path from 'node:path'
import express from 'express'
import type { RoomManager } from './rooms/roomManager.js'

export const app = express()
const frontendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')

app.use((_request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  next()
})

app.use(express.static(frontendDirectory))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'WatchNSync server' })
})

app.get(/^(?!\/api(?:\/|$)|\/socket\.io(?:\/|$)).*/, (_request, response) => {
  response.sendFile(path.join(frontendDirectory, 'index.html'))
})

export function configureRoomRoutes(roomManager: RoomManager) {
  app.post('/api/rooms', (_request, response) => {
    const room = roomManager.createRoom()
    response.status(201).json({ roomId: room.roomId })
  })
}
