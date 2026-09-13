import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
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
  role: 'Host' | 'Moderator' | 'Participant'
}

interface ParticipantUpdate {
  userId: string
  username: string
  role: RoomParticipant['role']
  participants: RoomParticipant[]
  moderatorsCanManageParticipants: boolean
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
  const navigate = useNavigate()
  const username = getUsername(state)
  const [copyFeedback, setCopyFeedback] = useState('')
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [syncState, setSyncState] = useState<SyncState | null>(null)
  const [participants, setParticipants] = useState<RoomParticipant[]>([])
  const [videoInput, setVideoInput] = useState('')
  const [videoError, setVideoError] = useState('')
  const [playerProgress, setPlayerProgress] = useState({ currentTime: 0, duration: 0 })
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [moderatorsCanManageParticipants, setModeratorsCanManageParticipants] = useState(false)
  const playerRef = useRef<YT.Player | null>(null)
  const isHost = participants.some((participant) => (
    participant.userId === socket.id && participant.role === 'Host'
  ))
  const isPartyController = participants.some((participant) => (
    participant.userId === socket.id && (
      participant.role === 'Host' || participant.role === 'Moderator'
    )
  ))
  const canManageParticipants = isHost || (isPartyController && moderatorsCanManageParticipants)
  const hostName = participants.find((participant) => participant.role === 'Host')?.username ?? 'Host'

  useEffect(() => {
    if (roomId && !username) {
      navigate(`/join?roomId=${encodeURIComponent(roomId)}`, { replace: true })
    }
  }, [navigate, roomId, username])

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

    if (isPartyController) {
      socket.emit('seek', { currentTime })
    } else {
      playerRef.current?.seekTo(currentTime, true)
    }

  }

  function handleSync() {
    if (!playerRef.current || !syncState) {
      return
    }

    playerRef.current.seekTo(syncState.currentTime, true)
    if (syncState.playState === 'playing') {
      playerRef.current.playVideo()
    } else {
      playerRef.current.pauseVideo()
    }
  }

  useEffect(() => {
    if (!username) {
      return
    }

    function handleConnect() {
      setIsConnected(true)

      if (roomId && username) {
        socket.emit('join_room', { roomId, username }, (result: { ok: boolean; error?: string }) => {
          if (!result.ok) {
            socket.disconnect()
            navigate(`/join?roomId=${encodeURIComponent(roomId)}`, {
              replace: true,
              state: { error: result.error ?? 'Unable to join this room.' },
            })
          }
        })
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
      setModeratorsCanManageParticipants(update.moderatorsCanManageParticipants)
    }

    function handleParticipantRemoved(update: ParticipantUpdate & { participants?: RoomParticipant[] }) {
      if (update.userId === socket.id) {
        socket.disconnect()
        navigate('/', { replace: true, state: { message: 'You were removed from the watch party.' } })
        return
      }

      if (update.participants) {
        handleParticipantUpdate(update as ParticipantUpdate)
      }
    }

    function handlePartyEnded() {
      socket.disconnect()
      navigate('/', { replace: true, state: { message: 'This watch party has ended.' } })
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('sync_state', handleSyncState)
    socket.on('user_joined', handleParticipantUpdate)
    socket.on('user_left', handleParticipantUpdate)
    socket.on('role_assigned', handleParticipantUpdate)
    socket.on('host_transferred', handleParticipantUpdate)
    socket.on('permissions_updated', handleParticipantUpdate)
    socket.on('participant_removed', handleParticipantRemoved)
    socket.on('party_ended', handlePartyEnded)

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
      socket.off('role_assigned', handleParticipantUpdate)
      socket.off('host_transferred', handleParticipantUpdate)
      socket.off('permissions_updated', handleParticipantUpdate)
      socket.off('participant_removed', handleParticipantRemoved)
      socket.off('party_ended', handlePartyEnded)
      socket.disconnect()
    }
  }, [roomId, username])

  useEffect(() => {
    const timer = window.setInterval(updatePlayerProgress, 250)
    return () => window.clearInterval(timer)
  }, [isScrubbing, syncState?.videoId])

  const hasVideo = Boolean(syncState?.videoId)
  const controlTitle = isPartyController ? 'Party controls' : 'Local controls'
  const shareLink = `${window.location.origin}/room/${encodeURIComponent(roomId ?? '')}`

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopyFeedback('Link copied')
    } catch {
      setCopyFeedback('Copy failed. Select the link to copy it manually.')
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0"><p className="text-xs font-semibold tracking-[0.2em] text-[#c45a67]">WATCH ROOM</p><h1 className="mt-2 break-words text-3xl font-black tracking-tight text-white sm:text-4xl">{hostName}'s Room</h1><p className="mt-2 text-sm text-slate-400">A shared screen for the whole crew.</p></div>
        <span aria-live="polite" className={`rounded-md border px-3 py-2 text-sm ${isConnected ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>{isConnected ? 'Connected' : 'Not connected'}</span>
      </div>
      <section className="mb-6 rounded-xl border border-slate-800 bg-gradient-to-b from-[#141923] to-[#101722] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-white">Share this room</p><p className="mt-1 text-xs text-slate-500">Send the link, or share the code below.</p></div><span className="w-fit max-w-full break-all rounded-md border border-[#5d2028] bg-[#2a151a] px-3 py-2 font-mono text-sm font-bold tracking-wide text-[#e0a0a8]">Room code: {roomId}</span></div>
          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row">
            <input aria-label="Shareable room link" className="min-w-0 w-full rounded-md border border-slate-700 bg-[#0b1018] px-3 py-2 text-sm text-slate-300" readOnly value={shareLink} />
            <button className="w-full shrink-0 rounded-md bg-[#8f1d2c] px-4 py-2 text-sm font-bold text-white hover:bg-[#a72b3b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45a67] sm:w-auto" onClick={handleCopyLink} type="button">Copy link</button>
          </div>
          {copyFeedback && <p aria-live="polite" className="mt-2 text-sm font-medium text-emerald-300">{copyFeedback}</p>}
      </section>
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
          <section className="rounded-xl border border-slate-800 bg-gradient-to-b from-[#141923] to-[#101722] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold text-white">{controlTitle}</h2>{!isPartyController && <button className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-red-400 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400" disabled={!hasVideo} onClick={handleSync} type="button">Sync now</button>}</div>
            {isPartyController && (
              <>
                <form className="mt-3 flex flex-col gap-3 sm:flex-row" onSubmit={handleVideoSubmit}>
                  <label className="sr-only" htmlFor="video-input">YouTube URL or video ID</label>
                  <input className="min-w-0 flex-1 rounded-md border border-slate-700 bg-[#0b1018] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#c45a67] focus:outline-2 focus:outline-offset-2 focus:outline-[#c45a67]" id="video-input" onChange={(event) => setVideoInput(event.target.value)} placeholder="Paste a YouTube URL or video ID" type="text" value={videoInput} />
                  <button className="w-full shrink-0 rounded-md bg-[#8f1d2c] px-4 py-2 text-sm font-bold text-white hover:bg-[#a72b3b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45a67] sm:w-auto" type="submit">Set party video</button>
                </form>
                {videoError && <p className="mt-2 text-sm text-red-700" role="alert">{videoError}</p>}
              </>
            )}
            {isPartyController && <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-md bg-[#8f1d2c] px-4 py-2 text-sm font-bold text-white hover:bg-[#a72b3b] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45a67]" disabled={!hasVideo} onClick={() => socket.emit('play', { currentTime: getCurrentTime() })} type="button">Play for everyone</button>
              <button className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45a67]" disabled={!hasVideo} onClick={() => socket.emit('pause', { currentTime: getCurrentTime() })} type="button">Pause for everyone</button>
            </div>}
            {isPartyController && <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>{formatTime(playerProgress.currentTime)}</span><span>{formatTime(playerProgress.duration)}</span></div>
              <label className="sr-only" htmlFor="playback-progress">Playback position</label>
              <input aria-label="Party playback position" className="h-2 w-full cursor-pointer accent-[#8f1d2c]" disabled={!hasVideo || playerProgress.duration === 0} id="playback-progress" max={playerProgress.duration || 0} min="0" onChange={(event) => handleSeek(Number(event.target.value))} onPointerDown={() => setIsScrubbing(true)} onPointerUp={() => setIsScrubbing(false)} step="0.1" type="range" value={Math.min(playerProgress.currentTime, playerProgress.duration || 0)} />
            </div>}
          </section>
        </div>
        <aside className="rounded-xl border border-slate-800 bg-gradient-to-b from-[#141923] to-[#101722] p-6">
          <UsersIcon className="size-6 text-red-400" />
          <h2 className="mt-4 font-semibold text-white">Participants</h2>
          {participants.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-slate-400">No one has joined this room yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {participants.map((participant) => (
                <li key={participant.userId} className="flex min-w-0 flex-col items-start gap-2 rounded-lg border border-slate-800 bg-[#0b1018] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">{participant.username}</p>
                  </div>
                  <div className="flex w-full min-w-0 flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${participant.role === 'Host' ? 'bg-red-950 text-red-300' : participant.role === 'Moderator' ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>{participant.role}</span>
                    {canManageParticipants && participant.userId !== socket.id && participant.role !== 'Host' && (
                      <>
                        <button className="text-xs font-semibold text-red-300 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400" onClick={() => socket.emit('assign_role', { userId: participant.userId, role: participant.role === 'Participant' ? 'Moderator' : 'Participant' })} type="button">{participant.role === 'Participant' ? 'Make moderator' : 'Make participant'}</button>
                        {isHost && <button className="text-xs font-semibold text-slate-700 hover:text-slate-900" onClick={() => socket.emit('transfer_host', { userId: participant.userId })} type="button">Make host</button>}
                        <button className="text-xs font-semibold text-red-700 hover:text-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700" onClick={() => socket.emit('remove_participant', { userId: participant.userId })} type="button">Remove</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {isHost && (
            <button className="mt-6 block text-left text-sm font-semibold text-red-700 hover:text-red-900" onClick={() => socket.emit('end_watch_party')} type="button">End watch party</button>
          )}
          {isHost && (
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <input checked={moderatorsCanManageParticipants} onChange={(event) => socket.emit('set_moderator_management', { enabled: event.target.checked })} type="checkbox" />
              Allow moderators to manage participants
            </label>
          )}
          <button className="mt-6 text-sm font-semibold text-red-300 hover:text-red-200" onClick={() => { socket.emit('leave_room'); navigate('/') }} type="button">Leave room</button>
        </aside>
      </div>
    </section>
  )
}
