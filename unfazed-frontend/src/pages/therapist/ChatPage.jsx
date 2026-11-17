import { useEffect, useState } from 'react'
import { api, tokens } from '../../api/axiosInstance'
import ChatWindow from '../../components/chat/ChatWindow'
import useEntitlement from '../../hooks/useEntitlement'
import { LockedHint } from '../../components/common/UpgradePrompt'

export default function ChatPage() {
  const ent = useEntitlement()
  const [clients, setClients] = useState([])
  const [sel, setSel] = useState('')
  useEffect(() => { api.get('/clients').then((r) => { setClients(r.data); if (r.data[0]) setSel(r.data[0]._id) }) }, [])
  if (ent.loading) return null
  if (!ent.can('chat')) return <LockedHint>Secure client chat is available on the Premium plan.</LockedHint>
  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <div className="card h-fit space-y-1 p-2">
        {clients.map((c) => (
          <button key={c._id} onClick={() => setSel(c._id)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${sel === c._id ? 'bg-brand-50 font-medium text-brand-700' : 'hover:bg-slate-100'}`}>{c.name}</button>
        ))}
      </div>
      {sel ? <ChatWindow role="therapist" token={tokens.therapist.get()} clientId={sel} http={api} historyUrl={`/chat/${sel}`} /> : <p className="text-sm text-slate-500">No clients yet.</p>}
    </div>
  )
}
