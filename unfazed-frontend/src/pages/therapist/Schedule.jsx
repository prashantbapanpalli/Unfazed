import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/axiosInstance'
import AvailabilityEditor from '../../components/scheduling/AvailabilityEditor'
import SessionList from '../../components/scheduling/SessionList'

export default function Schedule() {
  const [sessions, setSessions] = useState([])
  const [tab, setTab] = useState('upcoming')
  const load = useCallback(() => {
    const now = new Date().toISOString()
    const params = tab === 'upcoming' ? { from: now, status: 'confirmed' } : { to: now }
    api.get('/scheduling/sessions', { params }).then((r) => setSessions(tab === 'upcoming' ? r.data : r.data.reverse()))
  }, [tab])
  useEffect(() => { load() }, [load])
  const setStatus = async (id, status) => { await api.patch(`/scheduling/sessions/${id}/status`, { status }); load() }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Schedule</h1>
      <div className="flex gap-2">
        {['upcoming', 'past'].map((t) => <button key={t} onClick={() => setTab(t)} className={tab === t ? 'btn' : 'btn-ghost'}>{t}</button>)}
      </div>
      <SessionList sessions={sessions} onStatus={setStatus} />
      <AvailabilityEditor />
    </div>
  )
}
