import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { brl, cn, fmtDate, MESES } from '@/lib/utils'
import { StatCard } from '@/components/StatCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { MonthYearPicker } from '@/components/MonthYearPicker'
import { useCategories } from '@/lib/useCategories'
import { TrendingDown, TrendingUp, Plus, Receipt, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

const current = (() => {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
})()

export default function Dashboard() {
  const [range, setRange] = useState(current)
  const [report, setReport] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { categories } = useCategories()
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Lida com 400/404 por chamada: a API sinaliza “sem lançamentos no mês”
      // assim (histórico) — isso é “vazio”, não erro.
      const isEmptyStatus = (reason) =>
        [400, 404].includes(reason?.response?.status)

      const [repRes, txnRes] = await Promise.allSettled([
        api.get('/report/monthly_report', { params: range }),
        api.get('/transactions/list', { params: { page: 1, limit: 8 } }),
      ])

      let rep = null
      if (repRes.status === 'fulfilled') rep = repRes.value.data
      else if (isEmptyStatus(repRes.reason)) rep = { income: 0, expense: 0, by_category: {} }
      else throw repRes.reason

      let txn = []
      if (txnRes.status === 'fulfilled') {
        txn = Array.isArray(txnRes.value.data.items) ? txnRes.value.data.items : []
      } else if (!isEmptyStatus(txnRes.reason)) {
        throw txnRes.reason
      }

      setReport(rep)
      setRecent(txn)
    } catch (e) {
      // Sem dados confiáveis: mantém o relatório zerado para não exibir
      // números falsos, mas mostra o estado de erro com opção de tentar de novo.
      setReport({ income: 0, expense: 0, by_category: {} })
      setRecent([])
      setError(e.message)
      toast.error('Não foi possível carregar o painel.')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    load()
  }, [load])

  const income = Number(report?.income ?? 0)
  const expense = Number(report?.expense ?? 0)
  const balance = income - expense
  const byCat = report?.by_category || {}
  const title = `${MESES[range.month - 1]} ${range.year}`
  const catName = (id) => {
    const c = categories.find((c) => c.id === Number(id))
    return c ? c.name : '—'
  }
  const topCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const isEmpty = !loading && !error && income <= 0 && expense <= 0 && recent.length === 0

  if (error) {
    return (
      <PageHead title={`Balanço de ${title}`} eyebrow="Visão geral">
        <MonthYearPicker value={range} onChange={setRange} />
        <ErrorState onRetry={load} />
      </PageHead>
    )
  }

  if (isEmpty) {
    return (
      <PageHead title={`Balanço de ${title}`} eyebrow="Visão geral">
        <MonthYearPicker value={range} onChange={setRange} />
        <EmptyDashboard
          onCreate={(type) =>
            navigate('/despesas', { state: { open: 'new', presetType: type } })
          }
        />
      </PageHead>
    )
  }

  return (
    <PageHead title={loading ? 'Carregando…' : `Balanço de ${title}`} eyebrow="Visão geral">
      <MonthYearPicker value={range} onChange={setRange} />

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-10 sm:divide-x sm:divide-border">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Receitas"
              tone="income"
              value={brl(income)}
              delta="12%"
              sub="vs mês anterior"
            />
            <StatCard
              label="Despesas"
              tone="expense"
              value={brl(expense)}
              delta="-4%"
              sub="dentro do limite"
            />
            <StatCard
              label="Saldo"
              tone="balance"
              value={brl(balance)}
              sub="disponível agora"
            />
          </>
        )}
      </div>

      <div className="mt-9 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Lançamentos recentes */}
        <section>
          <SectionTitle
            title="Lançamentos recentes"
            action={<span className="text-primary">Janeiro · todas</span>}
          />
          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <TableHead />
            {loading ? (
              <LoadingRows rows={4} />
            ) : recent.length === 0 ? (
              <EmptyRow
                onAction={() =>
                  navigate('/despesas', { state: { open: 'new', presetType: 'expense' } })
                }
              />
            ) : (
              recent.map((t) => (
                <TableRow key={t.id} t={t} cat={catName(t.category_id)} />
              ))
            )}
          </div>
        </section>

        {/* Por categoria */}
        <section>
          <SectionTitle title="Por categoria" />
          <div className="mt-3 space-y-1 rounded-xl border border-border p-4">
            {!loading && topCats.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sem lançamentos neste mês.
              </p>
            )}
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="mb-3 h-8 w-full" />
                ))
              : topCats.map(([name, value]) => {
                  const pct = expense ? Math.round(((Number(value) || 0) / expense) * 100) : 0
                  return (
                    <div key={name} className="py-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{name}</span>
                        <span className="tnum text-muted-foreground">{brl(value)}</span>
                      </div>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border/60">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
          </div>
        </section>
      </div>
    </PageHead>
  )
}

/* ---------- subcomponentes ---------- */

function PageHead({ eyebrow, title, children }) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="display mt-1 text-3xl">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  )
}

function SectionTitle({ title, action }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </h2>
      {action}
    </div>
  )
}

function TableHead() {
  return (
    <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 border-b border-border bg-surface px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:grid-cols-[1.4fr_1fr_0.9fr_0.9fr_0.5fr]">
      <span>Lançamento</span>
      <span className="hidden sm:block">Categoria</span>
      <span className="hidden sm:block">Tipo</span>
      <span className="text-left sm:text-right">Valor</span>
      <span />
    </div>
  )
}

function TableRow({ t, cat }) {
  const isExpense = t.type === 'expense'
  return (
    <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-3 border-b border-border bg-card px-4 py-3 text-sm last:border-0 hover:bg-accent/40 sm:grid-cols-[1.4fr_1fr_0.9fr_0.9fr_0.5fr]">
      <div className="min-w-0">
        <div className="truncate font-medium">{t.title}</div>
        <div className="text-xs text-muted-foreground">{fmtDate(t.transaction_date)}</div>
      </div>
      <div className="hidden truncate text-muted-foreground sm:block">{cat}</div>
      <div className="hidden sm:block">
        <Badge variant={isExpense ? 'expense' : 'income'}>
          {isExpense ? 'Despesa' : 'Receita'}
        </Badge>
      </div>
      <div className={cn('tnum text-right font-semibold', isExpense ? 'text-expense' : 'text-income')}>
        {isExpense ? '−' : '+'}
        {brl(t.value)}
      </div>
      <div className="flex justify-end">
        <TrendingDown className={cn('size-4', isExpense ? 'text-expense' : 'text-income')} />
      </div>
    </div>
  )
}

function LoadingRows({ rows }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

function EmptyRow({ onAction }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm text-muted-foreground">Nenhum lançamento ainda.</p>
      <button
        onClick={onAction}
        className="mt-2 text-sm font-medium text-primary hover:underline"
      >
        Registrar a primeira despesa →
      </button>
    </div>
  )
}

function ErrorState({ onRetry }) {
  return (
    <div
      role="alert"
      className="mt-10 flex flex-col items-center rounded-xl border border-border bg-card px-6 py-14 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-expense/10 text-expense">
        <AlertCircle className="size-6" />
      </div>
      <h2 className="display mt-5 text-2xl">Não foi possível carregar o painel</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Houve um erro ao buscar seus dados. Verifique sua conexão e tente novamente.
      </p>
      <Button variant="outline" className="mt-7" onClick={onRetry}>
        <RefreshCw /> Tentar novamente
      </Button>
    </div>
  )
}

function EmptyDashboard({ onCreate }) {
  return (
    <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Receipt className="size-6" />
      </div>
      <h2 className="display mt-5 text-2xl">Sua conta ainda está vazia</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Nada por aqui ainda. Registre sua primeira movimentação para ver aqui o resumo do mês ao
        vivo.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => onCreate('expense')}>
          <TrendingDown /> Criar despesa
        </Button>
        <Button variant="outline" onClick={() => onCreate('income')}>
          <TrendingUp /> Criar receita
        </Button>
      </div>
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="pt-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-8 w-36" />
    </div>
  )
}