import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { RoomManager } from './rooms/roomManager.js'
import { RoomRole } from './rooms/types.js'

interface JoinRoomPayload {
  roomId: string
  username: string
}

type JoinRoomAcknowledgement = (result: { ok: true } | { ok: false; error: string }) => void

function isValidJoinRoomPayload(payload: unknown): payload is JoinRoomPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }

  const { roomId, username } = payload as Record<string, unknown>

  return (
    typeof roomId === 'string' &&
    roomId.trim().length > 0 &&
    roomId.trim().length <= 128 &&
    /^[a-zA-Z0-9-]+$/.test(roomId.trim()) &&
    typeof username === 'string' &&
    username.trim().length > 0 &&
    username.trim().length <= 48 &&
    !/[\r\n]/.test(username)
  )
}

export function configureSocketServer(httpServer: HttpServer, roomManager = new RoomManager()) {
  const socketRoomIds = new Map<string, string>()
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  })

  io.on('connection', (socket) => {
    console.info(`Socket connected: ${socket.id}`)

    const leaveCurrentRoom = () => {
      const roomId = socketRoomIds.get(socket.id)

      if (!roomId) {
        return
      }

      const participant = roomManager.getRoom(roomId)?.participants.get(socket.id)
      const wasRemoved = roomManager.removeParticipant(roomId, socket.id)
      socketRoomIds.delete(socket.id)
      socket.leave(roomId)

      if (wasRemoved && participant) {
        io.to(roomId).emit('user_left', {
          userId: participant.userId,
          username: participant.username,
          role: participant.role,
          participants: roomManager.listParticipants(roomId),
        })
      }
    }

    socket.on('join_room', (payload: unknown, acknowledge?: JoinRoomAcknowledgement) => {
      if (!isValidJoinRoomPayload(payload)) {
        acknowledge?.({ ok: false, error: 'A valid room ID and username are required.' })
        return
      }

      const roomId = payload.roomId.trim()
      const username = payload.username.trim()

      if (!roomManager.hasRoom(roomId)) {
        acknowledge?.({ ok: false, error: 'Room not found.' })
        return
      }

      leaveCurrentRoom()

      const role = roomManager.listParticipants(roomId).length === 0
        ? RoomRole.Host
        : RoomRole.Participant
      const participant = {
        userId: socket.id,
        username,
        role,
      }

      roomManager.addParticipant(roomId, participant)
      socketRoomIds.set(socket.id, roomId)
      socket.join(roomId)

      io.to(roomId).emit('user_joined', {
        userId: participant.userId,
        username: participant.username,
        role: participant.role,
        participants: roomManager.listParticipants(roomId),
      })

      const room = roomManager.getRoom(roomId)

      if (room) {
        socket.emit('sync_state', room.playbackState)
      }

      acknowledge?.({ ok: true })
    })

    socket.on('leave_room', () => {
      leaveCurrentRoom()
    })

    socket.on('disconnect', (reason) => {
      leaveCurrentRoom()
      console.info(`Socket disconnected: ${socket.id} (${reason})`)
    })
  })

  return io
}
