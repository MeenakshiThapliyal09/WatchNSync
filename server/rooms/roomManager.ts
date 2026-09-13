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
