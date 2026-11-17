export const money = (n) => `Rs ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
export const localTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone
export const dt = (iso, opts = { dateStyle: 'medium', timeStyle: 'short' }) => new Date(iso).toLocaleString('en-IN', opts)
export const time = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
export const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const statusStyle = {
  confirmed: 'bg-emerald-100 text-emerald-700', completed: 'bg-slate-200 text-slate-700', pending_payment: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-rose-100 text-rose-700', no_show: 'bg-orange-100 text-orange-700', expired: 'bg-slate-100 text-slate-500',
  active: 'bg-emerald-100 text-emerald-700', inactive: 'bg-slate-200 text-slate-600',
}
export async function openInvoice(axiosInstance, paymentId) {
  const res = await axiosInstance.get(`/payments/${paymentId}/invoice`, { responseType: 'blob' })
  window.open(URL.createObjectURL(res.data), '_blank')
}
