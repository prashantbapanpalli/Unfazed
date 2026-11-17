import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
  const { register: signup } = useAuth()
  const nav = useNavigate()
  const [error, setError] = useState('')

  const onSubmit = async (v) => {
    setError('')
    try {
      await signup({
        ...v,
        specializations: v.specializations.split(',').map((s) => s.trim()).filter(Boolean),
        languages: v.languages.split(',').map((s) => s.trim()).filter(Boolean),
      })
      nav('/dashboard')
    } catch (e) { setError(e.userMessage) }
  }

  return (
    <div className="mx-auto mt-12 max-w-md px-4">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Create your practice</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <div><label className="label">Full name</label><input className="input" placeholder="Dr. Anita Sharma" {...register('name', { required: 'Name is required' })} />{errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}</div>
        <div><label className="label">Email</label><input className="input" type="email" {...register('email', { required: 'Email is required' })} /></div>
        <div><label className="label">Password (min 6)</label><input className="input" type="password" {...register('password', { required: true, minLength: 6 })} /></div>
        <div><label className="label">Short bio</label><textarea className="input" rows={3} {...register('bio')} /></div>
        <div><label className="label">Specializations (comma separated)</label><input className="input" defaultValue="" {...register('specializations')} /></div>
        <div><label className="label">Languages (comma separated)</label><input className="input" defaultValue="" {...register('languages')} /></div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button className="btn w-full" disabled={isSubmitting}>Create account</button>
        <p className="text-center text-xs text-slate-500">Already registered? <Link className="text-brand-700 underline" to="/login">Log in</Link></p>
      </form>
    </div>
  )
}
