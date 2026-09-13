export const RoomRole = {
  Host: 'Host',
  Moderator: 'Moderator',
  Participant: 'Participant',
} as const

export type RoomRole = (typeof RoomRole)[keyof typeof RoomRole]

export interface Participant {
  userId: string
  username: string
  role: RoomRole
}

export interface SharedPlaybackState {
  videoId: string | null
  playState: 'paused' | 'playing'
  currentTime: number
}

export interface Room {
  roomId: string
  participants: Map<string, Participant>
  playbackState: SharedPlaybackState
  moderatorsCanManageParticipants: boolean
}
