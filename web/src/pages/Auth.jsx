import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { loginSchema, registerSchema } from '@/lib/schemas'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Moon, Sun } from 'lucide-react'

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-expense">{error}</p>}
    </div>
  )
}

function BrandPanel() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'noir'
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface p-10 lg:flex">
      <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative">
        <Logo />
      </div>
      <div className="relative">
        <h1 className="display text-4xl leading-[1.05]">
          A saúde das
          <br />
          <em className="text-primary">suas contas</em>
        </h1>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
          Controle despesas, organize categorias e encerre cada mês com clareza.
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          {['▲ receitas em alta', '◆ saldo positivo', '▼ sem atrasos'].map((p) => (
            <span
              key={p}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={toggle}
        className="relative flex w-fit items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
        {dark ? 'Ledger · Papel' : 'Ledger · Noir'}
      </button>
    </div>
  )
}

export default function AuthPage({ defaultMode = 'login' }) {
  const [mode, setMode] = useState(defaultMode)

  const { login, register, loading } = useAuth()
  const navigate = useNavigate()

  const schema = mode === 'login' ? loginSchema : registerSchema

  const {
    register: reg,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirm: '' },
  })

  const onSubmit = async (data) => {
    const payload = { email: data.email, password: data.password }
    const res = mode === 'login' ? await login(payload) : await register(payload)
    if (res.ok) {
      toast.success(mode === 'login' ? 'Bem-vindo(a) de volta!' : 'Conta criada com sucesso!')
      navigate('/dashboard')
    } else {
      toast.error(res.error || 'Não foi possível entrar.')
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v)}>
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1">
                Criar conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value={mode} className="mt-6">
              <h2 className="display text-2xl">
                {mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === 'login'
                  ? 'Entre para consultar o balanço do mês.'
                  : 'Leva menos de um minuto.'}
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <Field label="E-mail" error={errors.email?.message}>
                  <Input placeholder="voce@exemplo.com" {...reg('email')} />
                </Field>
                <Field label="Senha" error={errors.password?.message}>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...reg('password')}
                  />
                </Field>
                {mode === 'register' && (
                  <Field label="Confirmar senha" error={errors.confirm?.message}>
                    <Input type="password" placeholder="••••••••" {...reg('confirm')} />
                  </Field>
                )}

                <Button type="submit" className="mt-2 w-full" size="lg" disabled={loading}>
                  {loading
                    ? 'Aguarde…'
                    : mode === 'login'
                      ? 'Entrar'
                      : 'Criar conta'}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === 'login' ? (
                  <>
                    Ainda não tem conta?{' '}
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => setMode('register')}
                    >
                      Criar conta
                    </button>
                  </>
                ) : (
                  <>
                    Já tem uma conta?{' '}
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => setMode('login')}
                    >
                      Entrar
                    </button>
                  </>
                )}
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}