import axios from 'axios'

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '' : 'https://api.ledger.matheuslab.xyz')

const CSRF_COOKIE = 'csrf_token'

function readCookie(name) {
  return document.cookie
    .split('; ')
    .find((c) => c.startsWith(name + '='))
    ?.split('=').slice(1).join('=') ?? null
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const csrf = readCookie(CSRF_COOKIE)
  if (csrf) config.headers['X-CSRF-Token'] = decodeURIComponent(csrf)
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const s = error.response?.status
    const original = error.config
    const isSessionEndpoint = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh')
    if (s === 401 && !original?._retried && !isSessionEndpoint) {
      original._retried = true
      try {
        await api.post('/auth/refresh')
        return api(original)
      } catch {
        window.dispatchEvent(new CustomEvent('ledger:unauthorized'))
      }
    } else if (s === 401) {
      window.dispatchEvent(new CustomEvent('ledger:unauthorized'))
    }
    if (s === 403 && error.response?.data?.detail === 'csrf') {
      window.dispatchEvent(new CustomEvent('ledger:csrf-failed'))
    }
    return Promise.reject(error)
  },
)

export function errMsg(error) {
  const d = error?.response?.data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map((x) => x.msg || x).join(' · ')
  return error?.message || 'Algo deu errado. Tente novamente.'
}

export default api
