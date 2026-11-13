import { cn } from '@/lib/utils'

export function Logo({ className, markClassName }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex size-9 items-center justify-center overflow-hidden rounded-lg bg-[#1a1613] shadow-sm ring-1 ring-white/8',
          markClassName,
        )}
      >
        <img
          src="/icons/icon-192.png"
          alt=""
          aria-hidden="true"
          className="size-full object-cover"
          draggable="false"
        />
      </span>
      <span className="display text-[19px] leading-none">
        Ledger<em className="not-italic text-primary">·</em>
      </span>
    </div>
  )
}
