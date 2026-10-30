import { cn } from '@/lib/utils'

export function Logo({ className, markClassName }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm',
          markClassName,
        )}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
          <path
            d="M6 5.6c0-.9.7-1.6 1.6-1.6h8.8c.9 0 1.6.7 1.6 1.6V19H6V5.6Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M9 9h6M9 12.5h4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="display text-[19px] leading-none">
        Ledger<em className="not-italic text-primary">·</em>
      </span>
    </div>
  )
}