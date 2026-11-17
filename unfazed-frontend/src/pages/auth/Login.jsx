import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { email: 'sharma@example.com', password: 'password123' } })
  const { login } = useAuth()
  const nav = useNavigate()
  const [error, setError] = useState('')

  const onSubmit = async (v) => {
    setError('')
    try { await login(v); nav('/dashboard') } catch (e) { setError(e.userMessage) }
  }

  return (
    <div className="mx-auto mt-20 max-w-sm px-4">
      <h1 className="mb-1 text-2xl font-bold text-brand-700">Unfazed</h1>
      <p className="mb-6 text-sm text-slate-500">Run your practice from one branded link.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <div><label className="label">Email</label><input className="input" type="email" {...register('email', { required: true })} /></div>
        <div><label className="label">Password</label><input className="input" type="password" {...register('password', { required: true })} /></div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button className="btn w-full" disabled={isSubmitting}>Log in</button>
        <p className="text-center text-xs text-slate-500">New here? <Link className="text-brand-700 underline" to="/register">Create an account</Link></p>
      </form>
    </div>
  )
}
