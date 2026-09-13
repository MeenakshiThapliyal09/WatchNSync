import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRightIcon, PlusIcon } from '../components/icons'

function hasRoomId(value: unknown): value is { roomId: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'roomId' in value &&
    typeof value.roomId === 'string' &&
    value.roomId.length > 0
  )
}

export function CreateRoomPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  async function handleCreateRoom() {
    setError(null)
    const trimmedUsername = username.trim()

    if (!trimmedUsername) {
      setError('Enter your name to create and host the room.')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/rooms', { method: 'POST' })

      if (!response.ok) {
        throw new Error('Unable to create a room.')
      }

      const result: unknown = await response.json()

      if (!hasRoomId(result)) {
        throw new Error('The server returned an invalid room response.')
      }

      navigate(`/room/${encodeURIComponent(result.roomId)}`, {
        state: { username: trimmedUsername, showShareLink: true },
      })
    } catch {
      setError('We could not create a room. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid size-11 place-items-center rounded-lg bg-sky-50 text-sky-700"><PlusIcon className="size-6" /></div>
        <p className="mt-6 text-sm font-semibold tracking-wide text-sky-700">CREATE A ROOM</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Start a new watch room</h1>
        <p className="mt-4 leading-7 text-slate-600">Create a shareable watch room, invite your friends, and start watching together.</p>
        <label className="mt-8 block text-sm font-medium text-slate-700" htmlFor="creator-name">Your name</label>
        <input aria-invalid={Boolean(error)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:outline-2 focus:outline-offset-2 focus:outline-sky-700" id="creator-name" onChange={(event) => setUsername(event.target.value)} placeholder="Enter your name" type="text" value={username} />
        {error && <p className="mt-4 text-sm font-medium text-red-700" role="alert">{error}</p>}
        <button className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-sky-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={isCreating} onClick={handleCreateRoom} type="button">
          {isCreating ? 'Creating room…' : 'Create room'}
        </button>
        <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700" to="/join">Have a room link? Join instead <ArrowRightIcon className="size-4" /></Link>
      </div>
    </section>
  )
}
