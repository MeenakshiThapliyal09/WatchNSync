import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { UsersIcon } from '../components/icons'
import { YouTubePlayer } from '../components/YouTubePlayer'
import { socket } from '../services/socket'

interface SyncState {
  videoId: string | null
  playState: 'paused' | 'playing'
  currentTime: number
}

interface RoomParticipant {
  userId: string
  username: string
  role: 'Host' | 'Participant'
}

interface ParticipantUpdate {
  userId: string
  username: string
  role: RoomParticipant['role']
  participants: RoomParticipant[]
}

function getUsername(state: unknown): string | undefined {
  if (typeof state !== 'object' || state === null) {
    return undefined
  }

  const { username } = state as Record<string, unknown>
  return typeof username === 'string' && username.trim() ? username.trim() : undefined
}

export function RoomPage() {
  const { roomId } = useParams()
  const { state } = useLocation()
  const username = getUsername(state)
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [syncState, setSyncState] = useState<SyncState | null>(null)
  const [participants, setParticipants] = useState<RoomParticipant[]>([])

  useEffect(() => {
    function handleConnect() {
      setIsConnected(true)

      if (roomId && username) {
        socket.emit('join_room', { roomId, username })
      }
    }

    function handleDisconnect() {
      setIsConnected(false)
    }

    function handleSyncState(receivedState: SyncState) {
      setSyncState(receivedState)
    }

    function handleParticipantUpdate(update: ParticipantUpdate) {
      setParticipants(update.participants)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('sync_state', handleSyncState)
    socket.on('user_joined', handleParticipantUpdate)
    socket.on('user_left', handleParticipantUpdate)

    if (socket.connected) {
      handleConnect()
    } else {
      socket.connect()
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('sync_state', handleSyncState)
      socket.off('user_joined', handleParticipantUpdate)
      socket.off('user_left', handleParticipantUpdate)
      socket.disconnect()
    }
  }, [roomId, username])

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold tracking-wide text-sky-700">WATCH ROOM</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Room {roomId}</h1></div><span aria-live="polite" className={`rounded-full border px-3 py-1 text-sm ${isConnected ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}>{isConnected ? 'Connected' : 'Not connected'}</span></div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
        <YouTubePlayer videoId={syncState?.videoId} />
        <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <UsersIcon className="size-6 text-sky-700" />
          <h2 className="mt-4 font-semibold text-slate-950">Participants</h2>
          {participants.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">No one has joined this room yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {participants.map((participant) => (
                <li key={participant.userId} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{participant.username}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${participant.role === 'Host' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'}`}>{participant.role}</span>
                </li>
              ))}
            </ul>
          )}
          <Link className="mt-6 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700" to="/join">Return to join room</Link>
        </aside>
      </div>
    </section>
  )
}
