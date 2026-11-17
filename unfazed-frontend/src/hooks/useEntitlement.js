import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/axiosInstance'

// The frontend never decides plan access itself: it asks the API (which uses the
// Entitlement Service) and just reads the answer.
export default function useEntitlement() {
  const [data, setData] = useState(null)

  const refresh = useCallback(() => api.get('/therapist/features').then((r) => setData(r.data)), [])
  useEffect(() => { refresh() }, [refresh])

  const can = (key) => !!data?.access?.[key]?.allowed
  const info = (key) => data?.access?.[key]
  const canTemplate = (template) => !!data?.access?.note_templates?.limit?.includes(template)

  return { loading: !data, tier: data?.tier, displayName: data?.displayName, access: data?.access, can, info, canTemplate, refresh }
}
