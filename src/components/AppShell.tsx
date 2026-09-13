import { NavLink, Outlet } from 'react-router'

const navigation = [
  { to: '/create', label: 'Create room' },
  { to: '/join', label: 'Join room' },
]

function navigationClassName(isActive: boolean) {
  return `rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45a67] ${
    isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
  }`
}

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0b1018] text-slate-100">
      <header className="border-b border-slate-800 bg-gradient-to-b from-[#141923] to-[#101722]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <NavLink className="text-lg font-black tracking-tight text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c45a67]" to="/">
            Watch<span className="text-[#c45a67]">N</span>Sync
          </NavLink>
          <nav aria-label="Primary navigation" className="flex items-center gap-1">
            {navigation.map(({ to, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => navigationClassName(isActive)}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800 bg-gradient-to-b from-[#101722] to-[#0d131d]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-slate-500 sm:px-6 lg:px-8">
          <span className="font-semibold text-slate-300">Watch<span className="text-[#c45a67]">N</span>Sync</span>
          <nav aria-label="Legal navigation" className="flex gap-4">
            <NavLink className="hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45a67]" to="/privacy">Privacy</NavLink>
            <NavLink className="hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45a67]" to="/terms">Terms</NavLink>
          </nav>
        </div>
      </footer>
    </div>
  )
}
