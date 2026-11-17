import { money } from '../../utils/format'
export default function ServiceCard({ title, price, note }) {
  return (
    <div className="card">
      <div className="font-semibold">{title}</div>
      <div className="text-xl font-semibold text-brand-700">{money(price)}</div>
      {note && <div className="text-xs text-slate-500">{note}</div>}
    </div>
  )
}
