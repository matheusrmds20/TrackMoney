import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { transactionSchema } from '@/lib/schemas'
import api from '@/lib/api'
import { toInputDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { CategoryDialog } from '@/components/CategoryDialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const EMPTY = {
  title: '',
  description: '',
  value: '',
  type: 'expense',
  category_id: '',
  transaction_date: '',
}

export function TransactionDialog({
  open,
  onOpenChange,
  editing,
  categories,
  onSaved,
  presetType = 'expense',
  // Callback para o pai recarregar as categorias quando uma é criada no meio
  // do fluxo de lançamento.
  onCategoriesChanged,
}) {
  const [openCategory, setOpenCategory] = useState(false)
  // Sem categoria não é possível gravar um lançamento (o backend exige
  // category_id): sinalizado aqui e na página que hospeda o diálogo.
  const noCategories = categories.length === 0

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (!open) return
    if (editing) {
      reset({
        title: editing.title,
        description: editing.description || '',
        value: editing.value,
        type: editing.type,
        category_id: String(editing.category_id),
        transaction_date: toInputDate(editing.transaction_date),
      })
    } else {
      reset({ ...EMPTY, type: presetType || 'expense' })
    }
  }, [open, editing, reset, presetType])

  const type = watch('type')

  const onSubmit = async (data) => {
    const payload = {
      title: data.title,
      description: data.description || null,
      value: data.value,
      type: data.type,
      category_id: Number(data.category_id),
      transaction_date: data.transaction_date
        ? new Date(`${data.transaction_date}T12:00:00`).toISOString()
        : undefined,
    }
    try {
      if (editing) {
        await api.patch(`/transactions/update/${editing.id}`, payload)
      } else {
        await api.post('/transactions/', payload)
      }
      toast.success(editing ? 'Despesa atualizada.' : 'Despesa criada.')
      onOpenChange(false)
      onSaved?.()
    } catch (e) {
      const d = e?.response?.data?.detail
      toast.error(typeof d === 'string' ? d : 'Não foi possível salvar.')
    }
  }

  const segment = [
    { key: 'expense', label: 'Despesa' },
    { key: 'income', label: 'Receita' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar despesa' : 'Nova despesa'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Ajuste os dados do lançamento.' : 'Registre um novo lançamento.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* tipo */}
          <div className="flex items-center gap-1 rounded-md border border-border bg-background p-1">
            {segment.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setValue('type', s.key)}
                className={cn(
                  'flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors',
                  type === s.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div>
            <Label>Título</Label>
            <Input className="mt-1.5" placeholder="Ex.: Supermercado" {...register('title')} />
            {errors.title && <p className="mt-1 text-xs text-expense">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$)</Label>
              <Input
                className="mt-1.5"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                {...register('value')}
              />
              {errors.value && (
                <p className="mt-1 text-xs text-expense">{errors.value.message}</p>
              )}
            </div>
            <div>
              <Label>Data</Label>
              <Input className="mt-1.5" type="date" {...register('transaction_date')} />
            </div>
          </div>

          <div>
            <Label>Categoria</Label>
            {noCategories ? (
              <div className="mt-1.5 rounded-md border border-dashed border-border bg-surface px-3 py-3 text-sm">
                <p className="text-muted-foreground">
                  Você precisa de ao menos uma categoria para lançar.
                </p>
                <button
                  type="button"
                  onClick={() => setOpenCategory(true)}
                  className="mt-1 font-medium text-primary hover:underline"
                >
                  Criar categoria →
                </button>
              </div>
            ) : (
              <>
                <Select
                  value={watch('category_id') || undefined}
                  onValueChange={(v) => setValue('category_id', v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Escolha a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && (
                  <p className="mt-1 text-xs text-expense">{errors.category_id.message}</p>
                )}
              </>
            )}
          </div>

          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea
              className="mt-1.5"
              placeholder="Anotações sobre o gasto…"
              {...register('description')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || noCategories}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>

        {/* CRUD de categoria sem sair do fluxo de lançamento. */}
        <CategoryDialog
          open={openCategory}
          onOpenChange={setOpenCategory}
          editing={null}
          initialType={type}
          onSaved={() => {
            // Recarrega a lista e mantém o diálogo de lançamento aberto.
            onCategoriesChanged?.()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}