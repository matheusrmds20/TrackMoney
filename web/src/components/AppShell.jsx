import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Receipt, Tags, Settings, Moon, Sun, LogOut, Menu, X } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/despesas', label: 'Despesas', icon: Receipt },
  { to: '/categorias', label: 'Categorias', icon: Tags },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
]

function NavItems({ onNavigate }) {
  return (
    <nav className="mt-2 flex flex-1 flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            )
          }
        >
          <Icon className="size-[18px]" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'noir'
  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
      {dark ? 'Ledger · Papel' : 'Ledger · Noir'}
      <span className="ml-auto flex h-5 w-9 items-center rounded-full border border-border bg-background p-0.5">
        <span
          className={cn(
            'size-4 rounded-full bg-primary transition-transform',
            dark ? 'translate-x-0' : 'translate-x-4',
          )}
        />
      </span>
    </button>
  )
}

function UserBlock({ onNavigate }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const email = user?.email || 'conta@ledger.app'
  return (
    <div className="flex items-center justify-between border-t border-border pt-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
          {email.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">{email.split('@')[0]}</div>
          <div className="truncate text-xs text-muted-foreground">{email}</div>
        </div>
      </div>
      <button
        onClick={() => {
          logout()
          navigate('/') // volta à landing pública após sair
        }}
        title="Sair"
        className="text-muted-foreground transition-colors hover:text-expense"
      >
        <LogOut className="size-[18px]" />
      </button>
    </div>
  )
}

export default function AppShell() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface px-4 py-5 lg:flex">
        <Logo className="px-1" />
        <Separator className="mt-5 mb-2" />
        <NavItems />
        <ThemeToggle />
        <UserBlock />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <Logo markClassName="size-8" />
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-foreground hover:bg-accent"
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 ldg-overlay" onClick={() => setOpen(false)} />
          <div className="ldg-pop absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface px-4 py-5">
            <div className="flex items-center justify-between">
              <Logo />
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fechar">
                <X className="size-5" />
              </Button>
            </div>
            <Separator className="mt-4 mb-2" />
            <NavItems onNavigate={() => setOpen(false)} />
            <ThemeToggle />
            <UserBlock onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <main className="px-4 py-6 sm:px-6 lg:ml-60 lg:px-10 lg:py-8">
        <div className="mx-auto w-full max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}