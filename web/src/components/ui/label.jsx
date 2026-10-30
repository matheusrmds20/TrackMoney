import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Label = forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground',
      className,
    )}
    {...props}
  />
))
Label.displayName = 'Label'

export { Label }