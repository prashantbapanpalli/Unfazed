import { dt, money, statusStyle, openInvoice } from '../../utils/format'
import { api } from '../../api/axiosInstance'

// Full client profile: sessions + payments + packages + notes in one place
export default function ClientCard({ data }) {
  const { client, sessions, payments, packages, notes } = data
  return (
    <div className="space-y-4 text-sm">
      <div>
        <div className="text-base font-semibold">{client.name}</div>
        <div className="text-slate-500">{client.email} {client.phone && `| ${client.phone}`}</div>
        {client.intake?.presentingConcern && <p className="mt-2 rounded bg-slate-50 p-2">Concern: {client.intake.presentingConcern}</p>}
        <p className="mt-1 text-xs text-slate-500">Consent: {client.consent?.given ? `given ${dt(client.consent.at)}` : 'not recorded'}</p>
      </div>
      <Block title={`Sessions (${sessions.length})`}>
        {sessions.slice(0, 8).map((s) => (
          <div key={s._id} className="flex justify-between"><span>{dt(s.start)} ({s.duration} min)</span><span className={`badge ${statusStyle[s.status]}`}>{s.status}</span></div>
        ))}
      </Block>
      <Block title="Packages">
        {packages.map((p) => <div key={p._id}>{p.sessionsUsed}/{p.sessionsTotal} used, expires {dt(p.expiresAt, { dateStyle: 'medium' })}</div>)}
      </Block>
      <Block title="Payments">
        {payments.map((p) => (
          <div key={p._id} className="flex justify-between">
            <span>{p.description} - {money(p.total)} <em className="text-slate-500">({p.status})</em></span>
            {p.status === 'paid' && <button className="text-brand-600 underline" onClick={() => openInvoice(api, p._id)}>Invoice</button>}
          </div>
        ))}
      </Block>
      <Block title={`Notes (${notes.length})`}>
        {notes.slice(0, 5).map((n) => <div key={n._id}><span className={`badge mr-2 ${n.type === 'private' ? 'bg-slate-200' : 'bg-emerald-100 text-emerald-700'}`}>{n.type}</span>{dt(n.createdAt, { dateStyle: 'medium' })}</div>)}
      </Block>
    </div>
  )
}
const Block = ({ title, children }) => (
  <div><div className="mb-1 text-xs font-semibold uppercase text-slate-500">{title}</div><div className="space-y-1">{children}</div></div>
)
