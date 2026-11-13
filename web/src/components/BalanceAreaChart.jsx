import { useMemo, useState } from 'react'
import { brl } from '@/lib/utils'

export function BalanceAreaChart({ transactions = [], currentBalance = 0, month, year }) {
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // Calcula a curva acumulativa ao longo dos dias do mês
  const { points, daysInMonth, minVal, maxVal } = useMemo(() => {
    const d = new Date(year, month, 0)
    const days = d.getDate()

    // Soma diária de movimentação líquida (income - expense)
    const dailyNet = Array(days + 1).fill(0)
    for (const t of transactions) {
      if (!t.transaction_date) continue
      const day = new Date(t.transaction_date).getDate()
      if (day >= 1 && day <= days) {
        const val = Number(t.value) || 0
        if (t.type === 'income') {
          dailyNet[day] += val
        } else {
          dailyNet[day] -= val
        }
      }
    }

    // Calcular evolução acumulada dia a dia
    // Se tiver saldo atual e movimentações, retroage ou avança acumulado
    let running = 0
    const rawData = []
    for (let day = 1; day <= days; day++) {
      running += dailyNet[day]
      rawData.push({ day, balance: running, net: dailyNet[day] })
    }

    // Se não tiver transações registradas, exibe linha reta no saldo
    if (transactions.length === 0) {
      for (let day = 1; day <= days; day++) {
        rawData[day - 1] = { day, balance: currentBalance, net: 0 }
      }
    }

    const balances = rawData.map((d) => d.balance)
    let min = Math.min(...balances, 0)
    let max = Math.max(...balances, 100)
    if (min === max) {
      min -= 100
      max += 100
    }
    const range = max - min || 1

    // Mapear para coordenadas SVG (viewBox: 0 0 800 200)
    const width = 800
    const height = 180
    const paddingY = 25

    const mapped = rawData.map((item, idx) => {
      const x = (idx / (days - 1)) * width
      const normY = (item.balance - min) / range
      const y = height - paddingY - normY * (height - paddingY * 2)
      return { ...item, x, y }
    })

    return { points: mapped, daysInMonth: days, minVal: min, maxVal: max }
  }, [transactions, currentBalance, month, year])

  // Gerar o path SVG (Smooth Bezier ou Polilinha suave)
  const { pathD, areaD } = useMemo(() => {
    if (!points.length) return { pathD: '', areaD: '' }

    let p = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cx = (prev.x + curr.x) / 2
      p += ` C ${cx.toFixed(1)},${prev.y.toFixed(1)} ${cx.toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`
    }

    const last = points[points.length - 1]
    const area = `${p} L ${last.x.toFixed(1)},200 L ${points[0].x.toFixed(1)},200 Z`

    return { pathD: p, areaD: area }
  }, [points])

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Evolução do Mês
          </span>
          <h3 className="text-sm font-medium text-foreground">Fluxo & Saldo Acumulado</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            <span>Saldo diário</span>
          </div>
          {hoveredPoint && (
            <div className="font-medium text-foreground transition-all">
              Dia {hoveredPoint.day}: <span className="text-primary">{brl(hoveredPoint.balance)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-4 h-[180px] w-full">
        <svg
          viewBox="0 0 800 200"
          className="size-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="balanceAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.32" />
              <stop offset="85%" stopColor="var(--primary)" stopOpacity="0.02" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas de guia horizontais */}
          <line x1="0" y1="30" x2="800" y2="30" stroke="currentColor" strokeDasharray="3 3" className="text-border/60" strokeWidth="1" />
          <line x1="0" y1="95" x2="800" y2="95" stroke="currentColor" strokeDasharray="3 3" className="text-border/60" strokeWidth="1" />
          <line x1="0" y1="160" x2="800" y2="160" stroke="currentColor" strokeDasharray="3 3" className="text-border/60" strokeWidth="1" />

          {/* Área preenchida com gradiente dourado */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#balanceAreaGrad)"
              className="transition-all duration-300"
            />
          )}

          {/* Linha principal */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Pontos interativos nos dias com transações ou marcadores */}
          {points.map((pt) => {
            const hasMove = pt.net !== 0
            const isHovered = hoveredPoint?.day === pt.day
            if (!hasMove && !isHovered && pt.day % 7 !== 0 && pt.day !== 1 && pt.day !== daysInMonth) {
              return null
            }
            return (
              <g
                key={pt.day}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : hasMove ? 4 : 2.5}
                  fill="var(--card)"
                  stroke="var(--primary)"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />
              </g>
            )
          })}
        </svg>
      </div>

      {/* Eixo X com dias */}
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground/80">
        <span>Dia 01</span>
        <span>Dia 07</span>
        <span>Dia 15</span>
        <span>Dia 22</span>
        <span>Dia {daysInMonth}</span>
      </div>
    </div>
  )
}
