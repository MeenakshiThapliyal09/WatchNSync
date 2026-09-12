import { NavLink, Outlet } from 'react-router'

const navigation = [
  { to: '/create', label: 'Create room' },
  { to: '/join', label: 'Join room' },
]

function navigationClassName(isActive: boolean) {
  return `rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${
    isActive ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
  }`
}

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <NavLink className="text-lg font-bold tracking-tight text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-700" to="/">
            WatchNSync
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

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-slate-500 sm:px-6 lg:px-8">
          <span>WatchNSync</span>
          <nav aria-label="Legal navigation" className="flex gap-4">
            <NavLink className="hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700" to="/privacy">Privacy</NavLink>
            <NavLink className="hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700" to="/terms">Terms</NavLink>
          </nav>
        </div>
      </footer>
    </div>
  )
}
