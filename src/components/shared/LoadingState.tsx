import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  text?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }

export function LoadingState({ text = 'Carregando...', className, size = 'md' }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 gap-3', className)}>
      <Loader2 className={cn('animate-spin text-brand-secondary', sizeMap[size])} />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

export function LoadingSpinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <Loader2 className={cn('animate-spin text-brand-secondary', sizeMap[size], className)} />
}
