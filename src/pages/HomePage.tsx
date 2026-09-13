import { Link, useLocation } from 'react-router'
import { ArrowRightIcon, LinkIcon, PlayIcon, UsersIcon } from '../components/icons'

const steps = [
  { icon: LinkIcon, title: 'Choose a video', description: 'Start with a YouTube link when room controls are available.' },
  { icon: UsersIcon, title: 'Share the room', description: 'Invite the people you want to watch with.' },
  { icon: PlayIcon, title: 'Watch in sync', description: 'Playback will stay aligned for everyone in the room.' },
]

export function HomePage() {
  const { state } = useLocation()
  const message = typeof state === 'object' && state !== null && 'message' in state
    && typeof state.message === 'string'
    ? state.message
    : undefined

  return (
    <div>
      {message && <p aria-live="polite" className="mx-auto max-w-6xl px-4 pt-6 text-sm font-medium text-red-300 sm:px-6 lg:px-8">{message}</p>}
      <section className="border-b border-slate-800 bg-gradient-to-b from-[#141923] to-[#101722]">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-[#c45a67]">WATCH PARTIES, WITHOUT THE “WHERE ARE YOU?”</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">Press play. We’ll keep up.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">One room, one video, zero timestamp detective work.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex items-center justify-center gap-2 rounded-md bg-[#8f1d2c] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#a72b3b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45a67]" to="/create">
                Create a room <ArrowRightIcon className="size-4" />
              </Link>
              <Link className="inline-flex items-center justify-center rounded-md border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-400 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45a67]" to="/join">
                Join a room
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-[#070b11] p-3 shadow-2xl sm:p-5">
            <div className="aspect-video rounded-lg border border-slate-700 bg-[#151e2b] p-5 text-slate-100">
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-300"><span className="size-2 rounded-full bg-red-400" /> Room preview</div>
                <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-white text-slate-950"><PlayIcon className="size-5" /></span><span className="text-sm font-medium">Your YouTube video will appear here</span></div>
                <div className="h-1.5 rounded-full bg-slate-700"><div className="h-full w-1/3 rounded-full bg-[#8f1d2c]" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl"><h2 className="text-2xl font-bold tracking-tight text-white">The good kind of synchronized</h2><p className="mt-3 leading-7 text-slate-400">Make a room, share the link, pick a video, and let the room keep everyone together.</p></div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-lg border border-slate-800 bg-gradient-to-b from-[#141923] to-[#101722] p-6">
              <Icon className="size-6 text-[#c45a67]" />
              <h3 className="mt-4 font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
