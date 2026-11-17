import { API_ORIGIN } from '../../api/axiosInstance'
import { time } from '../../utils/format'

export default function MessageBubble({ m, me }) {
  const mine = m.sender === me
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200'}`}>
        {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
        {m.attachment?.url && <a className="underline" target="_blank" rel="noreferrer" href={API_ORIGIN + m.attachment.url}>{m.attachment.name || 'Attachment'}</a>}
        <div className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-slate-400'}`}>{time(m.createdAt)}{mine && m.readAt ? ' | read' : ''}</div>
      </div>
    </div>
  )
}
