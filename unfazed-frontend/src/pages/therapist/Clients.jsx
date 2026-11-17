import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { api } from '../../api/axiosInstance'
import ClientTable from '../../components/crm/ClientTable'
import ClientCard from '../../components/crm/ClientCard'
import Modal from '../../components/common/Modal'
import Loader from '../../components/common/Loader'
import useEntitlement from '../../hooks/useEntitlement'
import { LockedHint } from '../../components/common/UpgradePrompt'

export default function Clients() {
  const [clients, setClients] = useState(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [detail, setDetail] = useState(null)
  const [adding, setAdding] = useState(false)
  const ent = useEntitlement()
  const { register, handleSubmit, reset } = useForm()
  const [err, setErr] = useState('')

  const load = useCallback(() => api.get('/clients', { params: { q, status, sort, order } }).then((r) => setClients(r.data)), [q, status, sort, order])
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t) }, [load])

  const onSort = (k) => { if (k === sort) setOrder(order === 'asc' ? 'desc' : 'asc'); else { setSort(k); setOrder('asc') } }
  const open = (id) => api.get(`/clients/${id}`).then((r) => setDetail(r.data))
  const add = handleSubmit(async (v) => {
    setErr('')
    try {
      await api.post('/clients', { ...v, tags: v.tags ? v.tags.split(',').map((s) => s.trim()).filter(Boolean) : [] })
      reset(); setAdding(false); load(); ent.refresh()
    } catch (e) { setErr(e.userMessage) }
  })
  const cap = ent.info('active_client_cap')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Clients</h1>
        <button className="btn" onClick={() => setAdding(true)}>+ Add client</button>
      </div>
      {cap && cap.limit !== -1 && <LockedHint>Active clients: {cap.current} of {cap.limit} on your plan.</LockedHint>}
      <div className="flex gap-2">
        <input className="input max-w-xs" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
      </div>
      {!clients ? <Loader /> : <ClientTable clients={clients} onOpen={open} sort={sort} order={order} onSort={onSort} />}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Client profile" wide>{detail && <ClientCard data={detail} />}</Modal>
      <Modal open={adding} onClose={() => setAdding(false)} title="Add client">
        <form onSubmit={add} className="space-y-3">
          <div><label className="label">Name</label><input className="input" {...register('name', { required: true })} /></div>
          <div><label className="label">Email</label><input className="input" type="email" {...register('email', { required: true })} /></div>
          <div><label className="label">Phone</label><input className="input" {...register('phone')} /></div>
          <div><label className="label">Tags (comma separated)</label><input className="input" {...register('tags')} /></div>
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <button className="btn w-full">Save</button>
        </form>
      </Modal>
    </div>
  )
}
