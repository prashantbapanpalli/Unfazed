import { useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import CheckoutForm from '../../components/payments/CheckoutForm'

export default function Payment() {
  const { slug } = useParams()
  const nav = useNavigate()
  const checkout = useMemo(() => { try { return JSON.parse(sessionStorage.getItem('unfazed_checkout')) } catch { return null } }, [])
  if (!checkout) return <Navigate to={`/${slug}`} replace />
  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <CheckoutForm checkout={checkout} onPaid={() => { sessionStorage.removeItem('unfazed_checkout'); nav(`/${slug}/portal`) }} />
    </div>
  )
}
