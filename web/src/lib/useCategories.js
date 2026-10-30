import { useCallback, useEffect, useState } from 'react'
import api from '@/lib/api'
import { displayToApiType } from '@/lib/types'

// Tipo da API: já traduzido ("Receita"/"Despesa").
export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await api.get('/category/list')
      setCategories(res.data)
    } catch (e) {
      // dados ficam vazios; a página trata o erro quando necessário
      console.error('useCategories:', e)
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!loaded) load()
  }, [loaded, load])

  return { categories, loading, loaded, refresh: () => load(true) }
}

// Converte o tipo "Receita"/"Despesa" de volta para income/expense.
export function toApiType(displayType) {
  return displayToApiType[displayType] || 'expense'
}