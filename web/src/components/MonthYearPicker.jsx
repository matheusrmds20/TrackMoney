import { MESES } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function MonthYearPicker({ value, onChange }) {
  const now = new Date()
  const years = [now.getFullYear() - 1, now.getFullYear()]
  return (
    <div className="flex items-center gap-2">
      <Select
        value={String(value.month)}
        onValueChange={(v) => onChange({ ...value, month: Number(v) })}
      >
        <SelectTrigger className="w-[138px]" aria-label="Mês">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          {MESES.map((m, i) => (
            <SelectItem key={m} value={String(i + 1)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(value.year)}
        onValueChange={(v) => onChange({ ...value, year: Number(v) })}
      >
        <SelectTrigger className="w-[92px]" aria-label="Ano">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}