import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api, { errMsg } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [bootstrapped, setBootstrapped] = useState(false)
  const [loading, setLoading] = useState(false)
  const isAuthed = !!user

  useEffect(() => {
    api.get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setBootstrapped(true))
  }, [])

  useEffect(() => {
    const h = () => setUser(null)
    window.addEventListener('ledger:unauthorized', h)
    return () => window.removeEventListener('ledger:unauthorized', h)
  }, [])

  const login = useCallback(async ({ email, password }) => {
    setLoading(true)
    try {
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
      await api.post('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      const meRes = await api.get('/auth/me')
      setUser(meRes.data)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: errMsg(error) }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async ({ email, password }) => {
    setLoading(true)
    try {
      await api.post('/auth/register', { email, password })
      return await login({ email, password })
    } catch (error) {
      return { ok: false, error: errMsg(error) }
    } finally {
      setLoading(false)
    }
  }, [login])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {}
    setUser(null)
  }, [])

  if (!bootstrapped) return null

  return (
    <AuthContext.Provider value={{ isAuthed, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
