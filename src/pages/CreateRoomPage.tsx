import { Link } from 'react-router'
import { ArrowRightIcon, PlusIcon } from '../components/icons'

export function CreateRoomPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid size-11 place-items-center rounded-lg bg-sky-50 text-sky-700"><PlusIcon className="size-6" /></div>
        <p className="mt-6 text-sm font-semibold tracking-wide text-sky-700">CREATE A ROOM</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Start a new watch room</h1>
        <p className="mt-4 leading-7 text-slate-600">Room creation is not connected yet. This page will let you create a shareable room and select a YouTube video in a future phase.</p>
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">No room has been created.</div>
        <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700" to="/join">Have a room link? Join instead <ArrowRightIcon className="size-4" /></Link>
      </div>
    </section>
  )
}
