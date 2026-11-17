import { dt, statusStyle } from '../../utils/format'

export default function SessionList({ sessions, onStatus }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-3 py-2 text-left">When</th><th className="px-3 py-2 text-left">Client</th><th className="px-3 py-2 text-left">Status</th><th /></tr></thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s._id} className="border-t">
              <td className="px-3 py-2">{dt(s.start)} <span className="text-slate-400">({s.duration} min)</span></td>
              <td className="px-3 py-2">{s.clientId?.name}</td>
              <td className="px-3 py-2"><span className={`badge ${statusStyle[s.status]}`}>{s.status}</span></td>
              <td className="space-x-1 px-3 py-2 text-right">
                {s.status === 'confirmed' && (<>
                  <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => onStatus(s._id, 'completed')}>Done</button>
                  <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => onStatus(s._id, 'no_show')}>No-show</button>
                  <button className="btn-danger" onClick={() => onStatus(s._id, 'cancelled')}>Cancel</button>
                </>)}
              </td>
            </tr>
          ))}
          {!sessions.length && <tr><td colSpan="4" className="p-6 text-center text-slate-500">No sessions</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
