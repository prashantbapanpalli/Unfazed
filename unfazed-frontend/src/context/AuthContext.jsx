import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, tokens } from '../api/axiosInstance'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!tokens.therapist.get())

  const logout = useCallback(() => {
    tokens.therapist.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    if (!tokens.therapist.get()) return
    api.get('/auth/me').then((r) => setUser(r.data)).catch(logout).finally(() => setLoading(false))
  }, [logout])

  useEffect(() => {
    window.addEventListener('session-expired', logout)
    return () => window.removeEventListener('session-expired', logout)
  }, [logout])

  const authenticate = async (path, body) => {
    const { data } = await api.post(`/auth/${path}`, body)
    tokens.therapist.set(data.token)
    setUser(data.therapist)
    return data.therapist
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login: (b) => authenticate('login', b), register: (b) => authenticate('register', b), logout }}>
      {children}
    </AuthContext.Provider>
  )
}
