import { useEffect, useState } from 'react'
import { api } from '../../api/axiosInstance'
import RevenueChart from '../../components/analytics/RevenueChart'
import StatCard from '../../components/analytics/StatCard'
import Loader from '../../components/common/Loader'
import { LockedHint } from '../../components/common/UpgradePrompt'

export default function Analytics() {
  const [d, setD] = useState(null)
  useEffect(() => { api.get('/analytics').then((r) => setD(r.data)) }, [])
  if (!d) return <Loader />
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active clients (90 days)" value={d.activeClients} />
        {d.depth === 'full' && <StatCard label="No-show rate" value={`${d.noShowRate}%`} hint={`${d.sessionCounts.noShow} of ${d.sessionCounts.completed + d.sessionCounts.noShow} sessions`} />}
        <StatCard label="Months shown" value={d.revenueTrend.length} />
      </div>
      <div className="card"><h2 className="mb-3 font-semibold">Revenue</h2><RevenueChart data={d.revenueTrend} /></div>
      {d.depth !== 'full' && <LockedHint>Your plan shows the last 3 months of revenue. Upgrade for 12 months, no-show rate and top clients.</LockedHint>}
    </div>
  )
}
