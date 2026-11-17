import { useEffect, useState } from 'react'
import { api } from '../../api/axiosInstance'
import NoteEditor from '../../components/notes/NoteEditor'
import useEntitlement from '../../hooks/useEntitlement'
import { dt, statusStyle } from '../../utils/format'

export default function Notes() {
  const ent = useEntitlement()
  const [clients, setClients] = useState([])
  const [clientId, setClientId] = useState('')
  const [notes, setNotes] = useState([])
  const [editing, setEditing] = useState(null) // null | 'new' | note
  const [err, setErr] = useState('')

  useEffect(() => { api.get('/clients').then((r) => { setClients(r.data); if (r.data[0]) setClientId(r.data[0]._id) }) }, [])
  const load = () => clientId && api.get(`/notes/client/${clientId}`).then((r) => setNotes(r.data))
  useEffect(() => { load() }, [clientId]) // eslint-disable-line

  const save = async (v) => {
    setErr('')
    try {
      if (editing === 'new') await api.post('/notes', { ...v, clientId })
      else await api.put(`/notes/${editing._id}`, v)
      setEditing(null); load()
    } catch (e) { setErr(e.userMessage) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Session notes</h1>
        <div className="flex gap-2">
          <select className="input w-56" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <button className="btn" disabled={!clientId} onClick={() => setEditing('new')}>+ New note</button>
        </div>
      </div>
      {err && <p className="text-sm text-rose-600">{err}</p>}
      {editing && !ent.loading && (
        <div className="card"><NoteEditor key={editing._id || 'new'} initial={editing === 'new' ? null : editing} ent={ent} onSave={save} onCancel={() => setEditing(null)} /></div>
      )}
      {notes.map((n) => (
        <div key={n._id} className="card">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span><span className={`badge mr-2 ${n.type === 'private' ? 'bg-slate-200 text-slate-700' : statusStyle.confirmed}`}>{n.type}</span>{n.template.toUpperCase()} | {dt(n.createdAt)}</span>
            <button className="text-brand-600 underline" onClick={() => setEditing(n)}>Edit</button>
          </div>
          <div className="tiptap-view text-sm" dangerouslySetInnerHTML={{ __html: n.content }} />
        </div>
      ))}
      {!notes.length && <p className="text-sm text-slate-500">No notes yet for this client.</p>}
    </div>
  )
}
