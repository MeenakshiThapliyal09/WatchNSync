import { Link } from 'react-router'
import { ArrowRightIcon, LinkIcon } from '../components/icons'

export function JoinRoomPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid size-11 place-items-center rounded-lg bg-sky-50 text-sky-700"><LinkIcon className="size-6" /></div>
        <p className="mt-6 text-sm font-semibold tracking-wide text-sky-700">JOIN A ROOM</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Enter a shared watch room</h1>
        <p className="mt-4 leading-7 text-slate-600">Joining by room link will be available once room connectivity is implemented.</p>
        <label className="mt-8 block text-sm font-medium text-slate-700" htmlFor="room-link">Room link</label>
        <input id="room-link" className="mt-2 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-500 placeholder:text-slate-400" disabled placeholder="Room links are not available yet" type="text" />
        <button className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-slate-300 px-4 py-3 text-sm font-semibold text-slate-500" disabled type="button">Join room</button>
        <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700" to="/create">Need a room? Create one <ArrowRightIcon className="size-4" /></Link>
      </div>
    </section>
  )
}
