import { Link } from 'react-router-dom'
import Modal from './Modal'

const LABELS = {
  active_client_cap: 'You have reached the active client limit of your plan.',
  note_templates: 'This note template is not included in your plan.',
  analytics_depth: 'Full analytics is not included in your plan.',
  leads_per_month: 'Your plan does not include new client leads.',
}

// Shown globally whenever the API answers UPGRADE_REQUIRED, and inline where a feature is locked
export function UpgradeModal() {
  const [detail, setDetail] = useStateEvent()
  return (
    <Modal open={!!detail} onClose={() => setDetail(null)} title="Upgrade your plan">
      <p className="mb-4 text-sm text-slate-600">{LABELS[detail?.featureKey] || detail?.message}</p>
      <Link to="/subscription" onClick={() => setDetail(null)} className="btn">See plans</Link>
    </Modal>
  )
}

import { useEffect, useState } from 'react'
function useStateEvent() {
  const [detail, setDetail] = useState(null)
  useEffect(() => {
    const h = (e) => setDetail(e.detail)
    window.addEventListener('upgrade-required', h)
    return () => window.removeEventListener('upgrade-required', h)
  }, [])
  return [detail, setDetail]
}

export function LockedHint({ children }) {
  return (
    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
      {children} <Link to="/subscription" className="font-semibold underline">Upgrade</Link>
    </div>
  )
}
