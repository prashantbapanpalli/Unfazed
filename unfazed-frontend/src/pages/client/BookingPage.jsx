import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { clientApi, publicApi, tokens } from '../../api/axiosInstance'
import SlotPicker from '../../components/scheduling/SlotPicker'
import Loader from '../../components/common/Loader'

// Step 1: intake + consent  ->  Step 2: choose slot  ->  payment (or instant confirm with a package credit)
export default function BookingPage() {
  const { slug } = useParams()
  const nav = useNavigate()
  const [info, setInfo] = useState(null)
  const [step, setStep] = useState(tokens.client.get() ? 2 : 1)
  const [duration, setDuration] = useState(60)
  const [slot, setSlot] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => { publicApi.get(`/public/${slug}`).then((r) => { setInfo(r.data); setDuration(r.data.durations[0]) }) }, [slug])

  const intake = handleSubmit(async (v) => {
    setErr('')
    try {
      const { data } = await publicApi.post(`/public/${slug}/clients`, {
        name: v.name, email: v.email, phone: v.phone, consent: v.consent,
        intake: { age: v.age ? Number(v.age) : undefined, city: v.city, presentingConcern: v.concern },
      })
      tokens.client.set(data.token)
      setStep(2)
    } catch (e) { setErr(e.userMessage) }
  })

  const book = async () => {
    setErr(''); setBusy(true)
    try {
      const { data } = await clientApi.post(`/public/${slug}/book`, { start: slot, duration })
      if (data.order) {
        sessionStorage.setItem('unfazed_checkout', JSON.stringify(data))
        nav(`/${slug}/pay`)
      } else nav(`/${slug}/portal`) // paid with a package credit or free
    } catch (e) {
      setErr(e.userMessage)
      if (e.response?.status === 401 || e.response?.status === 403) { tokens.client.clear(); setStep(1) }
    } finally { setBusy(false) }
  }

  if (!info) return <Loader />
  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-8">
      <h1 className="text-xl font-semibold">Book with {info.therapist.name}</h1>
      {step === 1 && (
        <form onSubmit={intake} className="card space-y-3">
          <div><label className="label">Full name</label><input className="input" {...register('name', { required: true })} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Email</label><input type="email" className="input" {...register('email', { required: true })} /></div>
            <div><label className="label">Phone</label><input className="input" {...register('phone')} /></div>
            <div><label className="label">Age</label><input type="number" className="input" {...register('age')} /></div>
            <div><label className="label">City</label><input className="input" {...register('city')} /></div>
          </div>
          <div><label className="label">What brings you here?</label><textarea rows="3" className="input" {...register('concern')} /></div>
          <label className="flex gap-2 text-sm"><input type="checkbox" {...register('consent', { required: true })} /> I consent to therapy and to my information being stored securely.</label>
          {errors.consent && <p className="text-xs text-rose-600">Consent is required</p>}
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <button className="btn w-full">Continue</button>
        </form>
      )}
      {step === 2 && (
        <div className="card space-y-4">
          <div>
            <label className="label">Session length</label>
            <div className="flex gap-2">{info.durations.map((m) => <button key={m} onClick={() => { setDuration(m); setSlot(null) }} className={duration === m ? 'btn' : 'btn-ghost'}>{m} min</button>)}</div>
          </div>
          <SlotPicker slug={slug} duration={duration} value={slot} onChange={setSlot} />
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <button className="btn w-full" disabled={!slot || busy} onClick={book}>{busy ? 'Reserving...' : 'Reserve this slot'}</button>
        </div>
      )}
    </div>
  )
}
