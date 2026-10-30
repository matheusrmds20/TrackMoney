import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { useCategories } from '@/lib/useCategories'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CategoryDialog } from '@/components/CategoryDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function Categories() {
  const { categories, loading, refresh } = useCategories()
  const [editing, setEditing] = useState(null)
  const [openForm, setOpenForm] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const openNew = () => {
    setEditing(null)
    setOpenForm(true)
  }
  const openEdit = (c) => {
    setEditing(c)
    setOpenForm(true)
  }

  const ok = () => refresh()

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await api.delete(`/category/delete/${deleting.id}`)
      toast.success('Categoria excluída.')
      setDeleting(null)
      refresh()
    } catch (e) {
      toast.error('Não foi possível excluir.')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Categorias
          </p>
          <h1 className="display mt-1 text-3xl">
            Linhas do <em className="text-primary">orçamento</em>
          </h1>
        </div>
        <Button onClick={openNew}>
          <Plus /> Nova categoria
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border bg-surface px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span>Categoria</span>
          <span className="text-right">Tipo</span>
          <span className="w-20 text-right" />
        </div>

        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-4">
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhuma categoria ainda. Crie a primeira.
          </p>
        ) : (
          categories.map((c) => {
            const isIncome = c.type === 'Receita'
            return (
              <div
                key={c.id}
                className="group grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border bg-card px-4 py-3 text-sm last:border-0 hover:bg-accent/40"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{c.description}</div>
                </div>
                <Badge variant={isIncome ? 'income' : 'expense'}>
                  {isIncome ? 'Receita' : 'Despesa'}
                </Badge>
                <div className="flex w-20 items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Editar"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Excluir"
                    className="hover:text-expense"
                    onClick={() => setDeleting(c)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <CategoryDialog
        open={openForm}
        onOpenChange={setOpenForm}
        editing={editing}
        onSaved={ok}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Excluir categoria"
        description={
          deleting
            ? `Remover "${deleting.name}" permanentemente? Lembre-se de reatribuir os lançamentos.`
            : ''
        }
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
      />
    </div>
  )
}