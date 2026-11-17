import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { clientApi, publicApi, tokens } from '../../api/axiosInstance'
import ChatWindow from '../../components/chat/ChatWindow'
import InvoiceView from '../../components/payments/InvoiceView'
import Loader from '../../components/common/Loader'
import { dt, statusStyle } from '../../utils/format'

export default function ClientPortal() {
  const { slug } = useParams()
  const [me, setMe] = useState(null)
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('sessions')
  const [msg, setMsg] = useState('')
  const [pkgBusy, setPkgBusy] = useState(false)
  const [offer, setOffer] = useState([])

  const load = useCallback(async () => {
    const [m, s, n, p, k] = await Promise.all(['me', 'sessions', 'notes', 'payments', 'packages'].map((x) => clientApi.get(`/portal/${x}`).then((r) => r.data)))
    setMe(m); setData({ sessions: s, notes: n, payments: p, packages: k })
  }, [])
  useEffect(() => {
    if (!tokens.client.get()) return
    load().catch(() => tokens.client.clear())
    publicApi.get(`/public/${slug}`).then((r) => setOffer(r.data.packages))
  }, [load, slug])

  if (!tokens.client.get()) return (
    <div className="mx-auto max-w-md p-10 text-center">
      <p className="mb-4 text-slate-600">Your portal appears after you book your first session.</p>
      <Link to={`/${slug}/book`} className="btn">Book a session</Link>
    </div>
  )
  if (!me || !data) return <Loader />

  const cancel = async (id) => {
    try { await clientApi.post(`/scheduling/sessions/${id}/cancel`); setMsg('Session cancelled'); load() } catch (e) { setMsg(e.userMessage) }
  }
  const buy = async (pkgId) => {
    setPkgBusy(true)
    try {
      const { data: d } = await clientApi.post(`/public/${slug}/packages/${pkgId}/buy`)
      sessionStorage.setItem('unfazed_checkout', JSON.stringify(d))
      window.location.href = `/${slug}/pay`
    } catch (e) { setMsg(e.userMessage) } finally { setPkgBusy(false) }
  }
  const tabs = ['sessions', 'packages', 'notes', 'payments', 'chat']

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">Hi {me.client.name}</h1><p className="text-sm text-slate-500">with {me.therapist.name}</p></div>
        <div className="flex gap-2"><Link className="btn" to={`/${slug}/book`}>Book</Link><button className="btn-ghost" onClick={() => { tokens.client.clear(); window.location.reload() }}>Log out</button></div>
      </div>
      <div className="flex flex-wrap gap-2">{tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={tab === t ? 'btn' : 'btn-ghost'}>{t}</button>)}</div>
      {msg && <p className="text-sm text-brand-700">{msg}</p>}

      {tab === 'sessions' && <div className="card space-y-2">
        {data.sessions.map((s) => (
          <div key={s._id} className="flex items-center justify-between border-t py-2 text-sm first:border-0">
            <span>{dt(s.start)} ({s.duration} min)</span>
            <span className="flex items-center gap-2"><span className={`badge ${statusStyle[s.status]}`}>{s.status}</span>
              {['confirmed', 'pending_payment'].includes(s.status) && <button className="text-rose-600 underline" onClick={() => cancel(s._id)}>Cancel</button>}</span>
          </div>
        ))}
        {!data.sessions.length && <p className="text-sm text-slate-500">No sessions yet.</p>}
        <p className="text-xs text-slate-400">Cancellation is possible up to 24 hours before.</p>
      </div>}

      {tab === 'packages' && <div className="space-y-3">
        <div className="card">{data.packages.map((p) => <div key={p._id} className="py-1 text-sm">{p.sessionsTotal - p.sessionsUsed} of {p.sessionsTotal} sessions left, expires {dt(p.expiresAt, { dateStyle: 'medium' })}</div>)}
          {!data.packages.length && <p className="text-sm text-slate-500">No active packages.</p>}</div>
        <div className="grid gap-3 sm:grid-cols-2">{offer.map((p) => (
          <div key={p._id} className="card"><div className="font-semibold">{p.name}</div><div className="mb-2 text-sm text-slate-500">{p.sessions} sessions</div>
            <button className="btn w-full" disabled={pkgBusy} onClick={() => buy(p._id)}>Buy</button></div>
        ))}</div>
      </div>}

      {tab === 'notes' && <div className="space-y-3">
        {data.notes.map((n) => <div key={n._id} className="card"><div className="mb-1 text-xs text-slate-500">{dt(n.createdAt)}</div><div className="text-sm" dangerouslySetInnerHTML={{ __html: n.content }} /></div>)}
        {!data.notes.length && <p className="text-sm text-slate-500">Your therapist has not shared any notes.</p>}
      </div>}

      {tab === 'payments' && <div className="card"><InvoiceView payments={data.payments} /></div>}

      {tab === 'chat' && <ChatWindow role="client" token={tokens.client.get()} clientId={me.client._id} http={clientApi} historyUrl="/portal/chat" />}
    </div>
  )
}
