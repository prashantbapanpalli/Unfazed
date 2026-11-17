import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const links = [
  ['/dashboard', 'Dashboard'], ['/clients', 'Clients'], ['/schedule', 'Schedule'], ['/notes', 'Notes'],
  ['/chat', 'Chat'], ['/analytics', 'Analytics'], ['/subscription', 'Plan'],
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <span className="text-lg font-bold text-brand-700">Unfazed</span>
        <nav className="flex flex-wrap gap-1 text-sm">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `rounded-md px-3 py-1.5 ${isActive ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <a href={`/${user?.slug}`} target="_blank" rel="noreferrer" className="text-brand-700 underline">My page</a>
          <button className="btn-ghost" onClick={() => { logout(); nav('/login') }}>Log out</button>
        </div>
      </div>
    </header>
  )
}
