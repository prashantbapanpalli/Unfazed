import { Link } from 'react-router-dom'
export default function Hero({ t, slug }) {
  return (
    <div className="bg-brand-700 px-4 py-14 text-center text-white">
      <h1 className="text-3xl font-semibold">{t.name}</h1>
      <p className="mx-auto mt-3 max-w-xl text-brand-100">{(t.specializations || []).join(' | ')}</p>
      <Link to={`/${slug}/book`} className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-medium text-brand-700">Book a session</Link>
    </div>
  )
}
