import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { RoomManager } from './rooms/roomManager.js'
import { RoomRole } from './rooms/types.js'

interface JoinRoomPayload {
  roomId: string
  username: string
}

type JoinRoomAcknowledgement = (result: { ok: true } | { ok: false; error: string }) => void
const MAX_ROOM_CAPACITY = 150

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

function getBoolean(payload: unknown): boolean | undefined {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const { enabled } = payload as Record<string, unknown>
  return typeof enabled === 'boolean' ? enabled : undefined
}

export function configureSocketServer(httpServer: HttpServer, roomManager = new RoomManager()) {
  const socketRoomIds = new Map<string, string>()
  const blockedSocketIds = new Set<string>()
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  })

  io.on('connection', (socket) => {
    console.info(`Socket connected: ${socket.id}`)

    const emitParticipantUpdate = (roomId: string, event: string, participant?: { userId: string; username: string; role: string }) => {
      io.to(roomId).emit(event, {
        ...(participant ?? {}),
        participants: roomManager.listParticipants(roomId),
        moderatorsCanManageParticipants: roomManager.getRoom(roomId)?.moderatorsCanManageParticipants ?? false,
      })
    }

    const leaveCurrentRoom = (allowHostTransfer = true) => {
      const roomId = socketRoomIds.get(socket.id)

      if (!roomId) {
        return
      }

      const participant = roomManager.getRoom(roomId)?.participants.get(socket.id)
      const wasHost = participant?.role === RoomRole.Host
      const wasRemoved = roomManager.removeParticipant(roomId, socket.id)
      socketRoomIds.delete(socket.id)
      socket.leave(roomId)

      if (wasRemoved && participant) {
        if (wasHost && allowHostTransfer) {
          const nextParticipant = roomManager.listParticipants(roomId).find((member) => (
            member.role === RoomRole.Moderator
          )) ?? roomManager.listParticipants(roomId)[0]
          if (nextParticipant) {
            roomManager.updateParticipantRole(roomId, nextParticipant.userId, RoomRole.Host)
          }
        }
        emitParticipantUpdate(roomId, 'user_left', participant)
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

      if (blockedSocketIds.has(socket.id)) {
        acknowledge?.({ ok: false, error: 'You have been removed from this room.' })
        return
      }

      if (!roomManager.hasRoom(roomId)) {
        acknowledge?.({ ok: false, error: 'Room not found or has ended.' })
        return
      }

      if (roomManager.listParticipants(roomId).length >= MAX_ROOM_CAPACITY) {
        acknowledge?.({ ok: false, error: 'Room is full.' })
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

      emitParticipantUpdate(roomId, 'user_joined', participant)

      const room = roomManager.getRoom(roomId)

      if (room) {
        socket.emit('sync_state', room.playbackState)
      }

      acknowledge?.({ ok: true })
    })

    socket.on('leave_room', () => {
      leaveCurrentRoom()
    })

    socket.on('set_moderator_management', (payload: unknown) => {
      const roomId = getHostRoomId()
      const enabled = getBoolean(payload)

      if (!roomId || enabled === undefined || !roomManager.setModeratorsCanManageParticipants(roomId, enabled)) {
        return
      }

      emitParticipantUpdate(roomId, 'permissions_updated')
    })

    socket.on('transfer_host', (payload: unknown) => {
      const roomId = getHostRoomId()
      const userId = getTargetUserId(payload)

      if (!roomId || !userId || !roomManager.transferHost(roomId, userId)) {
        return
      }

      emitParticipantUpdate(roomId, 'host_transferred')
    })

    socket.on('assign_role', (payload: unknown) => {
      const currentRoomId = socketRoomIds.get(socket.id)
      const currentParticipant = currentRoomId
        ? roomManager.getRoom(currentRoomId)?.participants.get(socket.id)
        : undefined
      const roomId = currentParticipant?.role === RoomRole.Host ||
        (currentParticipant?.role === RoomRole.Moderator &&
          roomManager.getRoom(currentRoomId ?? '')?.moderatorsCanManageParticipants)
        ? currentRoomId
        : undefined
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
        emitParticipantUpdate(roomId, 'role_assigned', participant)
      }
    })

    socket.on('remove_participant', (payload: unknown) => {
      const currentRoomId = socketRoomIds.get(socket.id)
      const currentParticipant = currentRoomId
        ? roomManager.getRoom(currentRoomId)?.participants.get(socket.id)
        : undefined
      const roomId = currentParticipant?.role === RoomRole.Host ||
        (currentParticipant?.role === RoomRole.Moderator &&
          roomManager.getRoom(currentRoomId ?? '')?.moderatorsCanManageParticipants)
        ? currentRoomId
        : undefined
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
      blockedSocketIds.add(userId)
      removedSocket?.leave(roomId)

      const removal = {
        userId: participant.userId,
        username: participant.username,
        role: participant.role,
      }

      removedSocket?.emit('participant_removed', removal)
      emitParticipantUpdate(roomId, 'participant_removed', participant)
    })

    socket.on('end_watch_party', () => {
      const roomId = getHostRoomId()

      if (!roomId || !roomManager.endRoom(roomId)) {
        return
      }

      io.to(roomId).emit('party_ended')
      for (const [userId, userRoomId] of socketRoomIds) {
        if (userRoomId === roomId) {
          socketRoomIds.delete(userId)
          io.sockets.sockets.get(userId)?.leave(roomId)
        }
      }
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
      blockedSocketIds.delete(socket.id)
      console.info(`Socket disconnected: ${socket.id} (${reason})`)
    })
  })

  return io
}
