import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api, { tokenStore } from '@/lib/api'
import { errMsg } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStore.get())
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const isAuthed = !!token

  const logout = useCallback(() => {
    tokenStore.clear()
    setToken(null)
    setUser(null)
  }, [])

  // Se a sessão expirar (401 global), desloga.
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('ledger:unauthorized', handler)
    return () => window.removeEventListener('ledger:unauthorized', handler)
  }, [logout])

  const login = useCallback(async ({ email, password }) => {
    setLoading(true)
    try {
      // O backend usa OAuth2 form (username/password). Sobrescreve o
      // Content-Type global (application/json) para o form-urlencoded.
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
      const res = await api.post('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      const t = res.data.access_token
      tokenStore.set(t)
      setToken(t)
      setUser({ email })
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
      // Já registrado: entra automaticamente.
      return await login({ email, password })
    } catch (error) {
      return { ok: false, error: errMsg(error) }
    } finally {
      setLoading(false)
    }
  }, [login])

  return (
    <AuthContext.Provider value={{ isAuthed, token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}