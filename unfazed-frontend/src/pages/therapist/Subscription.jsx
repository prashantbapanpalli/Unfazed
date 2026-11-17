import { useEffect, useState } from 'react'
import { api } from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import useEntitlement from '../../hooks/useEntitlement'
import { money } from '../../utils/format'

export default function Subscription() {
  const [tiers, setTiers] = useState([])
  const ent = useEntitlement()
  const { user, setUser } = useAuth()
  useEffect(() => { api.get('/therapist/tiers').then((r) => setTiers(r.data)) }, [])
  const choose = async (tier) => {
    const { data } = await api.put('/therapist/subscription', { tier })
    setUser?.(data); ent.refresh()
  }
  const cap = (n) => (n === -1 ? 'Unlimited' : n)
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Plans</h1>
      <p className="text-sm text-slate-500">Demo mode: switching plans is instant (a real product would take payment first).</p>
      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((t) => {
          const current = ent.tier === t.tier
          return (
            <div key={t.tier} className={`card ${current ? 'ring-2 ring-brand-500' : ''}`}>
              <h2 className="text-lg font-semibold">{t.displayName}</h2>
              <p className="text-2xl font-semibold">{money(t.pricePerMonth)}<span className="text-sm font-normal text-slate-500">/month</span></p>
              <ul className="my-4 space-y-1 text-sm text-slate-600">
                <li>Active clients: {cap(t.features.activeClientCap)}</li>
                <li>Note templates: {t.features.noteTemplates.join(', ')}</li>
                <li>Analytics: {t.features.analyticsDepth}</li>
                <li>Leads per month: {t.features.leadsPerMonth || 'none'}</li>
                <li>Client chat: {t.features.chat ? 'yes' : 'no'}</li>
                <li>Platform fee: {t.platformFeePercent}%</li>
              </ul>
              <button className={current ? 'btn-ghost w-full' : 'btn w-full'} disabled={current} onClick={() => choose(t.tier)}>{current ? 'Current plan' : 'Choose'}</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
