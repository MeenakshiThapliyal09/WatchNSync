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

function getValidVideoId(payload: unknown): string | undefined {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const { videoId } = payload as Record<string, unknown>

  return typeof videoId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(videoId)
    ? videoId
    : undefined
}

function getValidCurrentTime(payload: unknown): number | undefined {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const { currentTime } = payload as Record<string, unknown>

  return typeof currentTime === 'number' && Number.isFinite(currentTime) && currentTime >= 0
    ? currentTime
    : undefined
}

function getRoleAssignment(payload: unknown): { userId: string; role: typeof RoomRole.Moderator | typeof RoomRole.Participant } | undefined {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const { userId, role } = payload as Record<string, unknown>

  if (
    typeof userId !== 'string' ||
    !userId.trim() ||
    (role !== RoomRole.Moderator && role !== RoomRole.Participant)
  ) {
    return undefined
  }

  return { userId, role }
}

function getTargetUserId(payload: unknown): string | undefined {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const { userId } = payload as Record<string, unknown>
  return typeof userId === 'string' && userId.trim() ? userId : undefined
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

    const getHostRoomId = () => {
      const roomId = socketRoomIds.get(socket.id)

      if (!roomId) {
        return undefined
      }

      const participant = roomManager.getRoom(roomId)?.participants.get(socket.id)
      return participant?.role === RoomRole.Host ? roomId : undefined
    }

    const getPlaybackRoomId = () => {
      const roomId = socketRoomIds.get(socket.id)

      if (!roomId) {
        return undefined
      }

      const participant = roomManager.getRoom(roomId)?.participants.get(socket.id)
      return participant?.role === RoomRole.Host || participant?.role === RoomRole.Moderator
        ? roomId
        : undefined
    }

    const broadcastSyncState = (roomId: string) => {
      const room = roomManager.getRoom(roomId)

      if (room) {
        io.to(roomId).emit('sync_state', room.playbackState)
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

    socket.on('assign_role', (payload: unknown) => {
      const roomId = getHostRoomId()
      const assignment = getRoleAssignment(payload)

      if (!roomId || !assignment) {
        return
      }

      const target = roomManager.getRoom(roomId)?.participants.get(assignment.userId)

      if (!target || target.role === RoomRole.Host) {
        return
      }

      const participant = roomManager.updateParticipantRole(roomId, assignment.userId, assignment.role)

      if (participant) {
        io.to(roomId).emit('role_assigned', {
          userId: participant.userId,
          username: participant.username,
          role: participant.role,
          participants: roomManager.listParticipants(roomId),
        })
      }
    })

    socket.on('remove_participant', (payload: unknown) => {
      const roomId = getHostRoomId()
      const userId = getTargetUserId(payload)

      if (!roomId || !userId) {
        return
      }

      const participant = roomManager.getRoom(roomId)?.participants.get(userId)

      if (!participant || participant.role === RoomRole.Host) {
        return
      }

      const removedSocket = io.sockets.sockets.get(userId)
      roomManager.removeParticipant(roomId, userId)
      socketRoomIds.delete(userId)
      removedSocket?.leave(roomId)

      const removal = {
        userId: participant.userId,
        username: participant.username,
        role: participant.role,
        participants: roomManager.listParticipants(roomId),
      }

      removedSocket?.emit('participant_removed', removal)
      io.to(roomId).emit('participant_removed', removal)
    })

    socket.on('change_video', (payload: unknown) => {
      const roomId = getPlaybackRoomId()
      const videoId = getValidVideoId(payload)

      if (!roomId || !videoId) {
        return
      }

      roomManager.updatePlaybackState(roomId, {
        videoId,
        playState: 'paused',
        currentTime: 0,
      })
      broadcastSyncState(roomId)
    })

    socket.on('play', (payload: unknown) => {
      const roomId = getPlaybackRoomId()

      if (!roomId) {
        return
      }

      const currentTime = getValidCurrentTime(payload)
      roomManager.updatePlaybackState(roomId, {
        playState: 'playing',
        ...(currentTime === undefined ? {} : { currentTime }),
      })
      broadcastSyncState(roomId)
    })

    socket.on('pause', (payload: unknown) => {
      const roomId = getPlaybackRoomId()

      if (!roomId) {
        return
      }

      const currentTime = getValidCurrentTime(payload)
      roomManager.updatePlaybackState(roomId, {
        playState: 'paused',
        ...(currentTime === undefined ? {} : { currentTime }),
      })
      broadcastSyncState(roomId)
    })

    socket.on('seek', (payload: unknown) => {
      const roomId = getPlaybackRoomId()
      const currentTime = getValidCurrentTime(payload)

      if (!roomId || currentTime === undefined) {
        return
      }

      roomManager.updatePlaybackState(roomId, { currentTime })
      broadcastSyncState(roomId)
    })

    socket.on('disconnect', (reason) => {
      leaveCurrentRoom()
      console.info(`Socket disconnected: ${socket.id} (${reason})`)
    })
  })

  return io
}
