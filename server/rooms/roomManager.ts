import { randomUUID } from 'node:crypto'
import type { Participant, Room, RoomRole, SharedPlaybackState } from './types.js'

function createInitialPlaybackState(): Room['playbackState'] {
  return {
    videoId: null,
    playState: 'paused',
    currentTime: 0,
  }
}

export class RoomManager {
  private readonly rooms = new Map<string, Room>()

  createRoom(): Room {
    let roomId = randomUUID()

    while (this.rooms.has(roomId)) {
      roomId = randomUUID()
    }

    const room: Room = {
      roomId,
      participants: new Map(),
      playbackState: createInitialPlaybackState(),
      moderatorsCanManageParticipants: false,
    }

    this.rooms.set(roomId, room)
    return room
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId)
  }

  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId)
  }

  addParticipant(roomId: string, participant: Participant): boolean {
    const room = this.rooms.get(roomId)

    if (!room) {
      return false
    }

    room.participants.set(participant.userId, participant)
    return true
  }

  removeParticipant(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId)

    if (!room) {
      return false
    }

    const wasRemoved = room.participants.delete(userId)
    this.deleteEmptyRoom(roomId)
    return wasRemoved
  }

  listParticipants(roomId: string): Participant[] {
    const room = this.rooms.get(roomId)
    return room ? [...room.participants.values()] : []
  }

  updateParticipantRole(
    roomId: string,
    userId: string,
    role: RoomRole,
  ): Participant | undefined {
    const participant = this.rooms.get(roomId)?.participants.get(userId)

    if (!participant) {
      return undefined
    }

    participant.role = role
    return participant
  }

  transferHost(roomId: string, userId: string): Participant[] | undefined {
    const room = this.rooms.get(roomId)
    const target = room?.participants.get(userId)
    const currentHost = room && [...room.participants.values()].find((participant) => (
      participant.role === 'Host'
    ))

    if (!room || !target || !currentHost || target.userId === currentHost.userId) {
      return undefined
    }

    currentHost.role = 'Participant'
    target.role = 'Host'
    return [...room.participants.values()]
  }

  setModeratorsCanManageParticipants(roomId: string, enabled: boolean): boolean {
    const room = this.rooms.get(roomId)

    if (!room) {
      return false
    }

    room.moderatorsCanManageParticipants = enabled
    return true
  }

  endRoom(roomId: string): boolean {
    return this.rooms.delete(roomId)
  }

  updatePlaybackState(
    roomId: string,
    update: Partial<SharedPlaybackState>,
  ): SharedPlaybackState | undefined {
    const room = this.rooms.get(roomId)

    if (!room) {
      return undefined
    }

    room.playbackState = {
      ...room.playbackState,
      ...update,
    }

    return room.playbackState
  }

  deleteEmptyRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId)

    if (!room || room.participants.size > 0) {
      return false
    }

    return this.rooms.delete(roomId)
  }
}
