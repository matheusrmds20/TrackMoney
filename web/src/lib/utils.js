import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combina classes Tailwind com detecção de conflito. */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/** Formata número como moeda BRL. */
export function brl(value) {
  const n = Number(value ?? 0)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Formata número BR (sem símbolo). */
export function num(value) {
  return Number(value ?? 0).toLocaleString('pt-BR')
}

/** Formata ISO datetime -> "14 Jan". */
export function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`
}

/** ISO datetime -> yyyy-mm-dd (para input date). */
export function toInputDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}