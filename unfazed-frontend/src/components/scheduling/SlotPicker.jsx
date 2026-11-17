import { useEffect, useState } from 'react'
import { publicApi } from '../../api/axiosInstance'
import { localTz, time } from '../../utils/format'

// Slots arrive as UTC ISO strings; the browser renders them in the CLIENT's own timezone.
export default function SlotPicker({ slug, duration, value, onChange }) {
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState(null)
  useEffect(() => {
    if (!date) return
    setSlots(null); onChange(null)
    publicApi.get(`/public/${slug}/slots`, { params: { date, duration } }).then((r) => setSlots(r.data.slots))
  }, [date, duration]) // eslint-disable-line
  return (
    <div className="space-y-3">
      <input type="date" className="input max-w-xs" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} />
      <p className="text-xs text-slate-500">Times shown in your timezone ({localTz()})</p>
      {date && !slots && <p className="text-sm text-slate-500">Loading...</p>}
      {slots && !slots.length && <p className="text-sm text-slate-500">No free slots on this day.</p>}
      <div className="flex flex-wrap gap-2">
        {slots?.map((s) => <button type="button" key={s} onClick={() => onChange(s)} className={value === s ? 'btn' : 'btn-ghost'}>{time(s)}</button>)}
      </div>
    </div>
  )
}
