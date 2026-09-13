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
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-[#141923] to-[#101722] p-6 shadow-xl sm:p-8">
        <div className="grid size-11 place-items-center rounded-lg bg-[#8f1d2c] text-white"><PlusIcon className="size-6" /></div>
        <p className="mt-6 text-sm font-semibold tracking-[0.18em] text-[#c45a67]">CREATE A ROOM</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Give your watch party a home.</h1>
        <p className="mt-4 leading-7 text-slate-400">Pick a name, make the room, then send the link to the people who should be in on it.</p>
        <label className="mt-8 block text-sm font-medium text-slate-300" htmlFor="creator-name">Your name</label>
        <input aria-invalid={Boolean(error)} className="mt-2 w-full rounded-md border border-slate-700 bg-[#0b1018] px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-[#c45a67] focus:outline-2 focus:outline-offset-2 focus:outline-[#c45a67]" id="creator-name" onChange={(event) => setUsername(event.target.value)} placeholder="e.g. Sam" type="text" value={username} />
        {error && <p className="mt-4 text-sm font-medium text-red-700" role="alert">{error}</p>}
        <button className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-[#8f1d2c] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#a72b3b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45a67] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400" disabled={isCreating} onClick={handleCreateRoom} type="button">
          {isCreating ? 'Creating room…' : 'Create room'}
        </button>
        <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#c45a67] hover:text-[#e0a0a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45a67]" to="/join">Have a room link? Join instead <ArrowRightIcon className="size-4" /></Link>
      </div>
    </section>
  )
}
