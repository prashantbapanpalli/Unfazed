import { useEffect, useState } from 'react'
import { api } from '../../api/axiosInstance'
import { dayName } from '../../utils/format'

const DURS = [30, 45, 60, 90]

export default function AvailabilityEditor() {
  const [av, setAv] = useState(null)
  const [msg, setMsg] = useState('')
  const [dayOff, setDayOff] = useState('')
  useEffect(() => { api.get('/scheduling/availability').then((r) => setAv(r.data)) }, [])
  if (!av) return null

  const setWeekly = (weekly) => setAv({ ...av, weekly })
  const addWin = (day) => setWeekly([...av.weekly, { day, start: '10:00', end: '17:00' }])
  const upd = (i, k, v) => setWeekly(av.weekly.map((w, j) => (j === i ? { ...w, [k]: v } : w)))
  const toggleDur = (d) => setAv({ ...av, durations: av.durations.includes(d) ? av.durations.filter((x) => x !== d) : [...av.durations, d] })
  const addOff = () => dayOff && setAv({ ...av, overrides: [...av.overrides.filter((o) => o.date !== dayOff), { date: dayOff, slots: [] }] })
  const save = async () => {
    try { await api.put('/scheduling/availability', av); setMsg('Saved') } catch (e) { setMsg(e.userMessage) }
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold">Availability</h2>
      {dayName.map((name, day) => (
        <div key={day} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="w-24 font-medium">{name}</span>
          {av.weekly.map((w, i) => w.day === day && (
            <span key={i} className="flex items-center gap-1">
              <input type="time" className="input w-28" value={w.start} onChange={(e) => upd(i, 'start', e.target.value)} />-
              <input type="time" className="input w-28" value={w.end} onChange={(e) => upd(i, 'end', e.target.value)} />
              <button className="text-rose-600" onClick={() => setWeekly(av.weekly.filter((_, j) => j !== i))}>x</button>
            </span>
          ))}
          <button className="text-brand-600 underline" onClick={() => addWin(day)}>+ add hours</button>
        </div>
      ))}
      <div className="flex flex-wrap items-end gap-4 text-sm">
        <div>
          <label className="label">Session lengths (min)</label>
          {DURS.map((d) => <label key={d} className="mr-3"><input type="checkbox" checked={av.durations.includes(d)} onChange={() => toggleDur(d)} /> {d}</label>)}
        </div>
        <div><label className="label">Buffer (min)</label><input type="number" className="input w-24" value={av.bufferMinutes} onChange={(e) => setAv({ ...av, bufferMinutes: Number(e.target.value) })} /></div>
        <div><label className="label">Day off</label><div className="flex gap-1"><input type="date" className="input" value={dayOff} onChange={(e) => setDayOff(e.target.value)} /><button className="btn-ghost" onClick={addOff}>Add</button></div></div>
      </div>
      {av.overrides.filter((o) => !o.slots.length).map((o) => (
        <span key={o.date} className="badge mr-2 bg-amber-100 text-amber-700">Off {o.date} <button onClick={() => setAv({ ...av, overrides: av.overrides.filter((x) => x.date !== o.date) })}> x</button></span>
      ))}
      <div className="flex items-center gap-3"><button className="btn" onClick={save}>Save availability</button><span className="text-sm text-emerald-700">{msg}</span></div>
    </div>
  )
}
