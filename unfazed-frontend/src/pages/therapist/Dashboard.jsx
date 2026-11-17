import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/analytics/StatCard'
import Loader from '../../components/common/Loader'
import useEntitlement from '../../hooks/useEntitlement'
import { dt, money } from '../../utils/format'

export default function Dashboard() {
  const { user } = useAuth()
  const ent = useEntitlement()
  const [sessions, setSessions] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/scheduling/sessions', { params: { from: new Date().toISOString(), status: 'confirmed' } }).then((r) => setSessions(r.data))
    api.get('/analytics').then((r) => setStats(r.data))
  }, [])
  if (!sessions || !stats) return <Loader />
  const thisMonth = stats.revenueTrend.at(-1)
  const link = `${window.location.origin}/${user.slug}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Hello, {user.name}</h1>
        <p className="text-sm text-slate-500">Your booking link: <a className="text-brand-600 underline" href={link} target="_blank" rel="noreferrer">{link}</a> | Plan: {ent.displayName}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active clients (90 days)" value={stats.activeClients} />
        <StatCard label="This month (net)" value={money(thisMonth?.net)} />
        <StatCard label="Upcoming sessions" value={sessions.length} />
      </div>
      <div className="card">
        <div className="mb-3 flex justify-between"><h2 className="font-semibold">Upcoming</h2><Link to="/schedule" className="text-sm text-brand-600 underline">Manage schedule</Link></div>
        {sessions.slice(0, 6).map((s) => (
          <div key={s._id} className="flex justify-between border-t py-2 text-sm"><span>{s.clientId?.name}</span><span className="text-slate-500">{dt(s.start)}</span></div>
        ))}
        {!sessions.length && <p className="text-sm text-slate-500">Nothing booked yet. Share your link to get started.</p>}
      </div>
    </div>
  )
}
