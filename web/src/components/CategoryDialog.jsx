import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { categorySchema } from '@/lib/schemas'
import { categoryFormDefaults } from '@/lib/types'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
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
import { Loader2 } from 'lucide-react'

const EMPTY = { name: '', type: 'expense', description: '' }

export function CategoryDialog({ open, onOpenChange, editing, onSaved, initialType }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (!open) return
    reset(
      editing
        ? categoryFormDefaults(editing)
        : { ...EMPTY, type: initialType === 'income' ? 'income' : 'expense' },
    )
  }, [open, editing, reset, initialType])

  const type = watch('type')

  const onSubmit = async (data) => {
    const payload = {
      name: data.name,
      type: data.type,
      description: data.description || null,
    }
    try {
      if (editing) {
        await api.patch(`/category/update/${editing.id}`, payload)
      } else {
        await api.post('/category/create', payload)
      }
      toast.success(editing ? 'Categoria atualizada.' : 'Categoria criada.')
      onOpenChange(false)
      onSaved?.()
    } catch (e) {
      const d = e?.response?.data?.detail
      toast.error(typeof d === 'string' ? d : 'Não foi possível salvar.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Ajuste os dados da categoria.' : 'Organize seus lançamentos por tipo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Tipo</Label>
            <div className="mt-1.5 flex items-center gap-1 rounded-md border border-border bg-background p-1">
              {[
                { key: 'expense', label: 'Despesa' },
                { key: 'income', label: 'Receita' },
              ].map((s) => (
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
            {errors.type && <p className="mt-1 text-xs text-expense">{errors.type.message}</p>}
          </div>

          <div>
            <Label>Nome</Label>
            <Input className="mt-1.5" placeholder="Ex.: Moradia" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-expense">{errors.name.message}</p>}
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              className="mt-1.5"
              placeholder="Ex.: Aluguel e contas da casa"
              {...register('description')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}