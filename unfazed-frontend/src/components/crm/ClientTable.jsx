import { dt, statusStyle } from '../../utils/format'

export default function ClientTable({ clients, onOpen, sort, order, onSort }) {
  const Th = ({ k, children }) => (
    <th className="cursor-pointer px-3 py-2 text-left" onClick={() => onSort(k)}>
      {children} {sort === k ? (order === 'asc' ? '^' : 'v') : ''}
    </th>
  )
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr><Th k="name">Name</Th><th className="px-3 py-2 text-left">Email</th><Th k="status">Status</Th><th className="px-3 py-2 text-left">Tags</th><Th k="lastSessionAt">Last session</Th></tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c._id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => onOpen(c._id)}>
              <td className="px-3 py-2 font-medium">{c.name}</td>
              <td className="px-3 py-2 text-slate-600">{c.email}</td>
              <td className="px-3 py-2"><span className={`badge ${statusStyle[c.status]}`}>{c.status}</span></td>
              <td className="px-3 py-2">{(c.tags || []).map((t) => <span key={t} className="badge mr-1 bg-brand-50 text-brand-700">{t}</span>)}</td>
              <td className="px-3 py-2 text-slate-500">{c.lastSessionAt ? dt(c.lastSessionAt, { dateStyle: 'medium' }) : '-'}</td>
            </tr>
          ))}
          {!clients.length && <tr><td colSpan="5" className="p-6 text-center text-slate-500">No clients found</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
