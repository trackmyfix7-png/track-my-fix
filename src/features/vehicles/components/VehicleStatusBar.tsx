import { cn } from '@/lib/utils'
import type { ServiceOrderStatus } from '@/types/database'

const steps: { key: ServiceOrderStatus; label: string }[] = [
  { key: 'received', label: 'Recebido' },
  { key: 'in_progress', label: 'Em processo' },
  { key: 'ready', label: 'Pronto' },
  { key: 'delivered', label: 'Entregue' },
]

const statusIndex: Record<ServiceOrderStatus, number> = {
  received: 0,
  in_progress: 1,
  ready: 2,
  delivered: 3,
}

interface VehicleStatusBarProps {
  status: ServiceOrderStatus
}

export function VehicleStatusBar({ status }: VehicleStatusBarProps) {
  const currentIndex = statusIndex[status]

  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute top-3 left-0 right-0 h-0.5 bg-border mx-[10%]" />
      <div
        className="absolute top-3 left-0 h-0.5 bg-brand-accent mx-[10%] transition-all duration-500"
        style={{ width: `${(currentIndex / (steps.length - 1)) * 80}%` }}
      />

      <div className="relative flex justify-between">
        {steps.map((step, i) => {
          const isCompleted = i < currentIndex
          const isCurrent = i === currentIndex

          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={cn(
                  'h-6 w-6 rounded-full border-2 flex items-center justify-center z-10 transition-colors',
                  isCompleted
                    ? 'bg-brand-accent border-brand-accent'
                    : isCurrent
                      ? 'bg-white border-brand-accent shadow-md shadow-brand-accent/30'
                      : 'bg-white border-border'
                )}
              >
                {isCompleted ? (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isCurrent ? (
                  <div className="h-2 w-2 rounded-full bg-brand-accent" />
                ) : null}
              </div>
              <span
                className={cn(
                  'text-[10px] text-center leading-tight',
                  isCurrent
                    ? 'font-semibold text-brand-accent'
                    : isCompleted
                      ? 'text-brand-primary font-medium'
                      : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
