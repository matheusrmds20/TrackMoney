import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Moon, Sun, AlertTriangle } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import api, { getUserId } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { cn } from '@/lib/utils'

const PREFS_KEY = 'ledger-preferences'
const DEFAULT_PREFS = { weekly: true, limit: true }

function loadPrefs() {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  )
}

export default function Settings() {
  const { theme, setMode } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [prefs, setPrefs] = useState(loadPrefs)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const setPref = (key, value) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next))
    } catch {}
  }

  const toggleTheme = (mode) => setMode(mode)

  const doDelete = async () => {
    const userId = getUserId()
    setDeleting(true)
    try {
      await api.delete('/auth/delete_user', { params: { user_id: userId } })
      toast.success('Conta excluída. Até logo!')
      logout()
      navigate('/login')
    } catch (e) {
      toast.error('Não foi possível excluir a conta.')
      setDeleting(false)
    }
  }

  const email = user?.email || '—'

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Ajustes
      </p>
      <h1 className="display mt-1 text-3xl">
        Perfil e <em className="text-primary">preferências</em>
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Gerencie sua conta, aparência e privacidade.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Perfil */}
        <Section title="Perfil">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-xl font-semibold text-secondary-foreground">
              {email.charAt(0).toUpperCase()}
            </span>
            <div>
              <div className="text-base font-semibold">{email.split('@')[0] || 'Conta'}</div>
              <div className="text-sm text-muted-foreground">{email}</div>
            </div>
          </div>
          <Separator className="my-5" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Moeda</div>
              <div className="text-xs text-muted-foreground">Formato dos valores</div>
            </div>
            <Select defaultValue="BRL">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">R$ Real</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        {/* Aparência */}
        <Section title="Aparência">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Tema</div>
              <div className="text-xs text-muted-foreground">Alterna entre os dois estilos Ledger</div>
            </div>
            <div className="flex items-center gap-1 rounded-md border border-border bg-background p-1">
              {[
                { key: 'noir', label: 'Noir', icon: Moon },
                { key: 'paper', label: 'Papel', icon: Sun },
              ].map((o) => {
                const Icon = o.icon
                return (
                  <button
                    key={o.key}
                    onClick={() => toggleTheme(o.key)}
                    className={cn(
                      'flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors',
                      theme === o.key
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="size-3.5" />
                    {o.label}
                  </button>
                )
              })}
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-4">
            {[
              { key: 'weekly', title: 'Resumo semanal', desc: 'Um e-mail com o balanço da semana' },
              { key: 'limit', title: 'Alerta de limite', desc: 'Aviso ao usar 80% de uma categoria' },
            ].map((p) => (
              <div key={p.key} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </div>
                <Switch checked={prefs[p.key]} onCheckedChange={(v) => setPref(p.key, v)} />
              </div>
            ))}
          </div>
        </Section>

        {/* Segurança */}
        <Section title="Segurança">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm font-medium">Alterar senha</div>
            <p className="mt-1 text-xs text-muted-foreground">
              A troca de senha não está disponível na API atual. Assim que o endpoint for
              publicado, adicionamos esta opção.
            </p>
            <Button variant="outline" size="sm" className="mt-3" disabled>
              Em breve
            </Button>
          </div>
        </Section>

        {/* Zona de perigo */}
        <Section title="Zona de perigo">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-expense" />
              <div>
                <div className="text-sm font-medium">Excluir conta</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Remove sua conta e todos os dados permanentemente. Esta ação não pode ser
                  desfeita.
                </p>
              </div>
            </div>
            <Button
              variant="outline-danger"
              size="sm"
              className="shrink-0"
              onClick={() => setConfirmDelete(true)}
            >
              Excluir conta
            </Button>
          </div>
        </Section>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir conta"
        description="Tem certeza que deseja excluir sua conta e todos os dados associados? Esta ação é irreversível."
        confirmLabel="Excluir conta"
        loading={deleting}
        onConfirm={doDelete}
      />
    </div>
  )
}