import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { LinkIcon, PlayIcon } from '../components/icons'
import { socket } from '../services/socket'

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

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    if (socket.connected) {
      handleConnect()
    } else {
      socket.connect()
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.disconnect()
    }
  }, [roomId, username])

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold tracking-wide text-sky-700">WATCH ROOM</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Room {roomId}</h1></div><span aria-live="polite" className={`rounded-full border px-3 py-1 text-sm ${isConnected ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}>{isConnected ? 'Connected' : 'Not connected'}</span></div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
        <div className="grid aspect-video place-items-center rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-slate-200"><div><span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-800"><PlayIcon className="size-6" /></span><h2 className="mt-4 font-semibold">Video playback is coming soon</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">This room will host a synchronized YouTube player once room controls are connected.</p></div></div>
        <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><LinkIcon className="size-6 text-sky-700" /><h2 className="mt-4 font-semibold text-slate-950">Room access</h2><p className="mt-2 text-sm leading-6 text-slate-600">Room links and participant access are not available yet.</p><Link className="mt-6 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700" to="/join">Return to join room</Link></aside>
      </div>
    </section>
  )
}
