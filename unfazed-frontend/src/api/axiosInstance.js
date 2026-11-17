import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

const TP_KEY = 'unfazed_therapist_token'
const CL_KEY = 'unfazed_client_token'

export const tokens = {
  therapist: { get: () => localStorage.getItem(TP_KEY), set: (t) => localStorage.setItem(TP_KEY, t), clear: () => localStorage.removeItem(TP_KEY) },
  client: { get: () => localStorage.getItem(CL_KEY), set: (t) => localStorage.setItem(CL_KEY, t), clear: () => localStorage.removeItem(CL_KEY) },
}

function make(role) {
  const instance = axios.create({ baseURL: API_BASE })
  instance.interceptors.request.use((config) => {
    const t = tokens[role].get()
    if (t) config.headers.Authorization = `Bearer ${t}`
    return config
  })
  instance.interceptors.response.use(
    (r) => r,
    (err) => {
      const d = err.response?.data
      // The API tells us when a plan limit is hit; the app shows one shared upgrade prompt
      if (err.response?.status === 403 && d?.code === 'UPGRADE_REQUIRED') window.dispatchEvent(new CustomEvent('upgrade-required', { detail: d }))
      if (err.response?.status === 401 && role === 'therapist') window.dispatchEvent(new CustomEvent('session-expired'))
      err.userMessage = d?.message || err.message
      return Promise.reject(err)
    },
  )
  return instance
}

export const api = make('therapist') // therapist dashboard
export const clientApi = make('client') // client portal
export const publicApi = axios.create({ baseURL: API_BASE }) // no auth
