import { Toaster as SonnerToaster } from 'sonner'
import { useTheme } from '@/context/ThemeContext'

export function Toaster() {
  const { theme } = useTheme()
  return (
    <SonnerToaster
      theme={theme === 'noir' ? 'dark' : 'light'}
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            '!border !border-border !bg-popover !text-foreground shadow-lg rounded-lg',
          title: '!text-sm !font-medium',
          description: '!text-sm !text-muted-foreground',
        },
      }}
    />
  )
}