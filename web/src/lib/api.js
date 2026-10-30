import axios from 'axios'

// Em dev (sem VITE_API_URL), usa caminho relativo — o Vite proxy encaminha para
// o backend e evita CORS. Em produção, usa a API hospedada.
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '' : 'https://trackmoney-jjnl.onrender.com')

const TOKEN_KEY = 'ledger_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Injeta o token JWT em toda requisição autenticada.
api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Em 401, limpa sessão e redireciona para login.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      tokenStore.clear()
      window.dispatchEvent(new CustomEvent('ledger:unauthorized'))
    }
    return Promise.reject(error)
  },
)

/** Extrai mensagem amigável de erro. */
export function errMsg(error) {
  const d = error?.response?.data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map((x) => x.msg || x).join(' · ')
  return error?.message || 'Algo deu errado. Tente novamente.'
}

/** Decodifica o id do usuário a partir do payload do JWT. */
export function getUserId() {
  try {
    const token = tokenStore.get()
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub ? Number(payload.sub) : null
  } catch {
    return null
  }
}

export default api