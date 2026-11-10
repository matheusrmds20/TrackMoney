import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import AppShell from '@/components/AppShell'

// Code-splitting: cada página vira um chunk carregado sob demanda.
const Landing = lazy(() => import('@/pages/Landing'))
const AuthPage = lazy(() => import('@/pages/Auth'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Transactions = lazy(() => import('@/pages/Transactions'))
const Categories = lazy(() => import('@/pages/Categories'))
const Settings = lazy(() => import('@/pages/Settings'))

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-2 w-40 overflow-hidden rounded-full border border-border bg-card">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
      </div>
    </div>
  )
}

function Protected() {
  const { isAuthed } = useAuth()
  if (!isAuthed) return <Navigate to="/" replace /> // não autenticado → landing pública
  return <AppShell />
}

function GuestArea() {
  const { isAuthed } = useAuth()
  if (isAuthed) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
      <Route element={<GuestArea />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage defaultMode="login" />} />
        <Route path="/register" element={<AuthPage defaultMode="register" />} />
      </Route>

      <Route element={<Protected />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/despesas" element={<Transactions />} />
        <Route path="/categorias" element={<Categories />} />
        <Route path="/ajustes" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}