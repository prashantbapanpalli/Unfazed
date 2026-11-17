import { clientApi } from '../../api/axiosInstance'
import { dt, money, openInvoice } from '../../utils/format'

export default function InvoiceView({ payments }) {
  return (
    <div className="space-y-2">
      {payments.map((p) => (
        <div key={p._id} className="flex items-center justify-between border-t py-2 text-sm">
          <div><div>{p.description}</div><div className="text-xs text-slate-500">{dt(p.paidAt)}</div></div>
          <div className="flex items-center gap-3"><span>{money(p.total)}</span><button className="text-brand-600 underline" onClick={() => openInvoice(clientApi, p._id)}>Invoice</button></div>
        </div>
      ))}
      {!payments.length && <p className="text-sm text-slate-500">No payments yet.</p>}
    </div>
  )
}
