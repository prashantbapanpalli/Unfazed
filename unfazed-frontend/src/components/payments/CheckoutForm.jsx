import { useState } from 'react'
import { clientApi } from '../../api/axiosInstance'
import { money } from '../../utils/format'

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true); s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

// Mock mode (no Razorpay keys): one click "pays". Live mode: opens Razorpay checkout, then the SERVER verifies the signature.
export default function CheckoutForm({ checkout, onPaid }) {
  const { payment, order, keyId, mock } = checkout
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const pay = async () => {
    setBusy(true); setErr('')
    try {
      if (mock) {
        await clientApi.post('/payments/mock-pay', { orderId: order.id })
        return onPaid()
      }
      if (!(await loadRazorpay())) throw new Error('Could not load Razorpay')
      new window.Razorpay({
        key: keyId, order_id: order.id, amount: order.amount, currency: order.currency, name: 'Unfazed', description: payment.description,
        handler: async (r) => {
          try { await clientApi.post('/payments/verify', r); onPaid() } catch (e) { setErr(e.userMessage) }
        },
      }).open()
    } catch (e) { setErr(e.userMessage || e.message) } finally { setBusy(false) }
  }

  return (
    <div className="card space-y-3">
      <h2 className="font-semibold">Payment</h2>
      <p className="text-sm text-slate-600">{payment.description}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between"><span>Amount</span><span>{money(payment.amount)}</span></div>
        {payment.gst > 0 && <div className="flex justify-between"><span>GST</span><span>{money(payment.gst)}</span></div>}
        <div className="flex justify-between border-t pt-1 font-semibold"><span>Total</span><span>{money(payment.total)}</span></div>
      </div>
      {mock && <p className="rounded bg-amber-50 p-2 text-xs text-amber-800">Test mode: no real money is charged.</p>}
      {err && <p className="text-sm text-rose-600">{err}</p>}
      <button className="btn w-full" disabled={busy} onClick={pay}>{busy ? 'Processing...' : `Pay ${money(payment.total)}`}</button>
    </div>
  )
}
