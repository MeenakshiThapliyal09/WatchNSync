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
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  async function handleCreateRoom() {
    setError(null)
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

      navigate(`/room/${result.roomId}`)
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
        <p className="mt-4 leading-7 text-slate-600">Create a shareable watch room. Choosing a YouTube video will be available in a future phase.</p>
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">A new room will be ready to share after it is created.</div>
        {error && <p className="mt-4 text-sm font-medium text-red-700" role="alert">{error}</p>}
        <button className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-sky-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={isCreating} onClick={handleCreateRoom} type="button">
          {isCreating ? 'Creating room…' : 'Create room'}
        </button>
        <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700" to="/join">Have a room link? Join instead <ArrowRightIcon className="size-4" /></Link>
      </div>
    </section>
  )
}
