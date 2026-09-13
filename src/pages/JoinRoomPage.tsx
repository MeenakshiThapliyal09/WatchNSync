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
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid size-11 place-items-center rounded-lg bg-sky-50 text-sky-700"><LinkIcon className="size-6" /></div>
        <p className="mt-6 text-sm font-semibold tracking-wide text-sky-700">JOIN A ROOM</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Enter a shared watch room</h1>
        <p className="mt-4 leading-7 text-slate-600">Enter the room ID shared by the host and the name you want to use in the room.</p>
        <form className="mt-8" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700" htmlFor="room-id">Room ID</label>
          <input aria-invalid={Boolean(error)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:outline-2 focus:outline-offset-2 focus:outline-sky-700" id="room-id" onChange={(event) => setRoomId(event.target.value)} placeholder="Enter the room ID" type="text" value={roomId} />
          <label className="mt-5 block text-sm font-medium text-slate-700" htmlFor="username">Your name</label>
          <input aria-invalid={Boolean(error)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:outline-2 focus:outline-offset-2 focus:outline-sky-700" id="username" onChange={(event) => setUsername(event.target.value)} placeholder="Enter your name" type="text" value={username} />
          {error && <p className="mt-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
          <button className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-sky-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700" type="submit">Join room</button>
        </form>
        <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700" to="/create">Need a room? Create one <ArrowRightIcon className="size-4" /></Link>
      </div>
    </section>
  )
}
