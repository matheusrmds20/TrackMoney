import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { brl, cn, fmtDate } from '@/lib/utils'
import { useCategories } from '@/lib/useCategories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TransactionDialog } from '@/components/TransactionDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const TYPE_FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'expense', label: 'Despesas' },
  { key: 'income', label: 'Receitas' },
]

export default function Transactions() {
  const { categories } = useCategories()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')

  const [editing, setEditing] = useState(null)
  const [openForm, setOpenForm] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [dialogType, setDialogType] = useState('expense')

  // Abre o diálogo “nova despesa/receita” automaticamente quando o dashboard
  // navega com { state: { open: 'new', presetType } }.
  const location = useLocation()
  useEffect(() => {
    if (location.state?.open === 'new') {
      const preset = location.state.presetType === 'income' ? 'income' : 'expense'
      setEditing(null)
      setDialogType(preset)
      setOpenForm(true)
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await api.get('/transactions/list', { params: { page: 1, limit: 100 } })
      setItems(Array.isArray(res.data.items) ? res.data.items : [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (catFilter !== 'all' && String(t.category_id) !== catFilter) return false
      if (q && !`${t.title} ${t.description || ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, search, typeFilter, catFilter])

  const catName = useCallback(
    (id) => {
      const c = categories.find((c) => c.id === Number(id))
      return c ? c.name : '—'
    },
    [categories],
  )

  const openNew = (type = 'expense') => {
    setEditing(null)
    setDialogType(type)
    setOpenForm(true)
  }
  const openEdit = (t) => {
    setEditing(t)
    setOpenForm(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await api.delete(`/transactions/delete/${deleting.id}`)
      toast.success('Despesa excluída.')
      setDeleting(null)
      load()
    } catch (e) {
      toast.error('Não foi possível excluir.')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Despesas
          </p>
          <h1 className="display mt-1 text-3xl">
            Lançamentos <em className="text-primary">recentes</em>
          </h1>
        </div>
        <Button onClick={() => openNew()}>
          <Plus /> Nova despesa
        </Button>
      </div>

      {/* controles */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 sm:w-72">
          <Search className="size-4 text-muted-foreground" />
          <Input
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:border-0"
            placeholder="Buscar lançamento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={cn(
                'rounded px-3 py-1.5 text-sm font-medium transition-colors',
                typeFilter === f.key
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44" aria-label="Filtrar por categoria">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* lista */}
      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1.6fr_1.1fr_1fr_1fr_auto] gap-3 border-b border-border bg-surface px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span>Lançamento</span>
          <span>Categoria</span>
          <span className="hidden sm:block">Data</span>
          <span className="hidden text-right sm:block">Valor</span>
          <span />
        </div>

        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-4">
                <Skeleton className="h-4 w-2/5" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Não foi possível carregar as despesas.
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {items.length === 0
              ? 'Nada por aqui ainda. Crie a primeira despesa.'
              : 'Nenhum resultado para os filtros.'}
          </p>
        ) : (
          filtered.map((t) => {
            const isExpense = t.type === 'expense'
            return (
              <div
                key={t.id}
                className="group grid grid-cols-[1.6fr_1.1fr_1fr_1fr_auto] items-center gap-3 border-b border-border bg-card px-4 py-3 text-sm last:border-0 hover:bg-accent/40"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {t.description || fmtDate(t.transaction_date)}
                  </div>
                </div>
                <div className="min-w-0">
                  <Badge variant="secondary" className="max-w-full truncate">
                    {catName(t.category_id)}
                  </Badge>
                </div>
                <div className="hidden text-muted-foreground sm:block">
                  {fmtDate(t.transaction_date)}
                </div>
                <div
                  className={cn(
                    'tnum hidden text-right font-semibold sm:block',
                    isExpense ? 'text-expense' : 'text-income',
                  )}
                >
                  {isExpense ? '−' : '+'}
                  {brl(t.value)}
                </div>
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Editar"
                    onClick={() => openEdit(t)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Excluir"
                    className="hover:text-expense"
                    onClick={() => setDeleting(t)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Exibindo {filtered.length} de {items.length} lançamentos carregados.
      </p>

      <TransactionDialog
        open={openForm}
        onOpenChange={setOpenForm}
        editing={editing}
        categories={categories}
        presetType={dialogType}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Excluir despesa"
        description={
          deleting
            ? `Remover "${deleting.title}" permanentemente? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
      />
    </div>
  )
}