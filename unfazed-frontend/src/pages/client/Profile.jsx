import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { publicApi } from '../../api/axiosInstance'
import Hero from '../../components/profile/Hero'
import ServiceCard from '../../components/profile/ServiceCard'
import Loader from '../../components/common/Loader'

// Sets <meta> tags at runtime. (Real link previews on WhatsApp need server-side rendering - noted in README.)
function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', content)
}

export default function Profile() {
  const { slug } = useParams()
  const [d, setD] = useState(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    publicApi.get(`/public/${slug}`).then((r) => {
      setD(r.data)
      const t = r.data.therapist
      document.title = `${t.name} - Book a session`
      setMeta('property', 'og:title', `${t.name} - Therapist`)
      setMeta('property', 'og:description', (t.bio || '').slice(0, 150))
      setMeta('property', 'og:type', 'profile')
      setMeta('name', 'description', (t.bio || '').slice(0, 150))
    }).catch(() => setMissing(true))
  }, [slug])

  if (missing) return <div className="p-10 text-center">This page does not exist. <Link className="underline" to="/">Home</Link></div>
  if (!d) return <Loader />
  const { therapist: t, packages, durations } = d
  return (
    <div>
      <Hero t={t} slug={slug} />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <section><h2 className="mb-2 text-lg font-semibold">About</h2><p className="whitespace-pre-line text-slate-700">{t.bio || 'Welcome.'}</p>
          <p className="mt-2 text-sm text-slate-500">Languages: {(t.languages || []).join(', ') || '-'}</p></section>
        <section>
          <h2 className="mb-3 text-lg font-semibold">Services</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {durations.map((m) => <ServiceCard key={m} title={`${m} minute session`} price={(t.sessionRate * m) / 60} note={t.advancePercent < 100 ? `${t.advancePercent}% advance at booking` : 'Pay at booking'} />)}
            {packages.map((p) => <ServiceCard key={p._id} title={p.name} price={p.sessions * p.ratePerSession} note={`${p.sessions} sessions, valid ${p.validityDays} days`} />)}
          </div>
        </section>
        <div className="flex gap-3">
          <Link to={`/${slug}/book`} className="btn">Book now</Link>
          <Link to={`/${slug}/portal`} className="btn-ghost">Client login / portal</Link>
        </div>
      </div>
    </div>
  )
}
