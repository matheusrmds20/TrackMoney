import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

const ICONS = { income: TrendingUp, expense: TrendingDown, balance: Wallet }

export function StatCard({ label, value, tone = 'income', sub, delta }) {
  const Icon = ICONS[tone] || Wallet
  const positive = Number(delta) >= 0
  return (
    <div className="border-t-2 border-current/0 pt-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
        <Icon className={cn('size-3.5', toneText[tone])} />
      </div>
      <div className={cn('display tnum mt-1 text-[26px] leading-none', toneText[tone])}>
        {value}
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {delta !== undefined && (
          <span
            className={cn(
              'font-medium',
              tone !== 'expense'
                ? positive
                  ? 'text-income'
                  : 'text-expense'
                : positive
                  ? 'text-expense'
                  : 'text-income',
            )}
          >
            {positive ? '+' : ''}
            {delta}
          </span>
        )}
        {sub && <span className="text-muted-foreground">{sub}</span>}
      </div>
    </div>
  )
}

const toneText = {
  income: 'text-income',
  expense: 'text-expense',
  balance: 'text-primary',
}