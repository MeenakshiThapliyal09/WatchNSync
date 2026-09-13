import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { UsersIcon } from '../components/icons'
import { extractYouTubeVideoId, YouTubePlayer } from '../components/YouTubePlayer'
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
  const [videoInput, setVideoInput] = useState('')
  const [videoError, setVideoError] = useState('')
  const [playerProgress, setPlayerProgress] = useState({ currentTime: 0, duration: 0 })
  const [isScrubbing, setIsScrubbing] = useState(false)
  const playerRef = useRef<YT.Player | null>(null)
  const isHost = participants.some((participant) => (
    participant.userId === socket.id && participant.role === 'Host'
  ))

  function getCurrentTime() {
    return playerRef.current?.getCurrentTime() ?? syncState?.currentTime ?? 0
  }

  function updatePlayerProgress() {
    if (!playerRef.current || isScrubbing) {
      return
    }

    const duration = playerRef.current.getDuration()
    const currentTime = playerRef.current.getCurrentTime()

    if (Number.isFinite(duration) && duration > 0 && Number.isFinite(currentTime)) {
      setPlayerProgress({ currentTime, duration })
    }
  }

  function formatTime(seconds: number) {
    const totalSeconds = Math.max(0, Math.floor(seconds))
    const minutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  function handleVideoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const videoId = extractYouTubeVideoId(videoInput)

    if (!videoId) {
      setVideoError('Enter a valid YouTube URL or video ID.')
      return
    }

    setVideoError('')
    socket.emit('change_video', { videoId })
  }

  function handleSeek(currentTime: number) {
    setPlayerProgress((progress) => ({ ...progress, currentTime }))

    if (isHost) {
      socket.emit('seek', { currentTime })
    } else {
      playerRef.current?.seekTo(currentTime, true)
    }
  }

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

  useEffect(() => {
    const timer = window.setInterval(updatePlayerProgress, 250)
    return () => window.clearInterval(timer)
  }, [isScrubbing, syncState?.videoId])

  const hasVideo = Boolean(syncState?.videoId)
  const controlTitle = isHost ? 'Party controls' : 'Local controls'

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold tracking-wide text-sky-700">WATCH ROOM</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Room {roomId}</h1></div><span aria-live="polite" className={`rounded-full border px-3 py-1 text-sm ${isConnected ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}>{isConnected ? 'Connected' : 'Not connected'}</span></div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
        <div className="space-y-4">
          <YouTubePlayer
            currentTime={syncState?.currentTime ?? 0}
            onReady={(player) => {
              playerRef.current = player
              updatePlayerProgress()
            }}
            playState={syncState?.playState ?? 'paused'}
            videoId={syncState?.videoId}
          />
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">{controlTitle}</h2>
            {isHost && (
              <>
                <form className="mt-3 flex flex-col gap-3 sm:flex-row" onSubmit={handleVideoSubmit}>
                  <label className="sr-only" htmlFor="video-input">YouTube URL or video ID</label>
                  <input className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:outline-2 focus:outline-offset-2 focus:outline-sky-700" id="video-input" onChange={(event) => setVideoInput(event.target.value)} placeholder="Paste a YouTube URL or video ID" type="text" value={videoInput} />
                  <button className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700" type="submit">Set party video</button>
                </form>
                {videoError && <p className="mt-2 text-sm text-red-700" role="alert">{videoError}</p>}
              </>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700" disabled={!hasVideo} onClick={() => isHost ? socket.emit('play', { currentTime: getCurrentTime() }) : playerRef.current?.playVideo()} type="button">{isHost ? 'Play for everyone' : 'Play locally'}</button>
              <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700" disabled={!hasVideo} onClick={() => isHost ? socket.emit('pause', { currentTime: getCurrentTime() }) : playerRef.current?.pauseVideo()} type="button">{isHost ? 'Pause for everyone' : 'Pause locally'}</button>
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>{formatTime(playerProgress.currentTime)}</span><span>{formatTime(playerProgress.duration)}</span></div>
              <label className="sr-only" htmlFor="playback-progress">Playback position</label>
              <input aria-label={isHost ? 'Party playback position' : 'Local playback position'} className="h-2 w-full cursor-pointer accent-sky-700" disabled={!hasVideo || playerProgress.duration === 0} id="playback-progress" max={playerProgress.duration || 0} min="0" onChange={(event) => handleSeek(Number(event.target.value))} onPointerDown={() => setIsScrubbing(true)} onPointerUp={() => setIsScrubbing(false)} step="0.1" type="range" value={Math.min(playerProgress.currentTime, playerProgress.duration || 0)} />
            </div>
          </section>
        </div>
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
