import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ArrowRightIcon, LinkIcon } from '../components/icons'

export function JoinRoomPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [roomId, setRoomId] = useState(() => new URLSearchParams(location.search).get('roomId') ?? '')
  const [username, setUsername] = useState('')
  const [error, setError] = useState(() => {
    const state = location.state
    return typeof state === 'object' && state !== null && 'error' in state && typeof state.error === 'string'
      ? state.error
      : ''
  })

  function getRoomId(value: string) {
    const trimmedValue = value.trim()

    try {
      const url = new URL(trimmedValue)
      const match = url.pathname.match(/^\/room\/([^/]+)$/)
      return match ? decodeURIComponent(match[1]) : trimmedValue
    } catch {
      return trimmedValue
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedRoomId = getRoomId(roomId)
    const trimmedUsername = username.trim()

    if (!trimmedRoomId || !trimmedUsername) {
      setError('Enter both a room ID and your name to continue.')
      return
    }

    navigate(`/room/${encodeURIComponent(trimmedRoomId)}`, {
      state: { username: trimmedUsername },
    })
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-[#141923] to-[#101722] p-6 shadow-xl sm:p-8">
        <div className="grid size-11 place-items-center rounded-lg bg-[#8f1d2c] text-white"><LinkIcon className="size-6" /></div>
        <p className="mt-6 text-sm font-semibold tracking-[0.18em] text-[#c45a67]">JOIN A ROOM</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Your seat is probably still warm.</h1>
        <p className="mt-4 leading-7 text-slate-400">Paste the room link or code, add your name, and you’re in.</p>
        <form className="mt-8" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-300" htmlFor="room-id">Room link or code</label>
          <input aria-invalid={Boolean(error)} className="mt-2 w-full rounded-md border border-slate-700 bg-[#0b1018] px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-[#c45a67] focus:outline-2 focus:outline-offset-2 focus:outline-[#c45a67]" id="room-id" onChange={(event) => setRoomId(event.target.value)} placeholder="Paste a room link or code" type="text" value={roomId} />
          <label className="mt-5 block text-sm font-medium text-slate-300" htmlFor="username">Your name</label>
          <input aria-invalid={Boolean(error)} className="mt-2 w-full rounded-md border border-slate-700 bg-[#0b1018] px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-[#c45a67] focus:outline-2 focus:outline-offset-2 focus:outline-[#c45a67]" id="username" onChange={(event) => setUsername(event.target.value)} placeholder="e.g. Alex" type="text" value={username} />
          {error && <p className="mt-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
          <button className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-[#8f1d2c] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#a72b3b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45a67]" type="submit">Join room</button>
        </form>
        <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#c45a67] hover:text-[#e0a0a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45a67]" to="/create">Need a room? Create one <ArrowRightIcon className="size-4" /></Link>
      </div>
    </section>
  )
}
