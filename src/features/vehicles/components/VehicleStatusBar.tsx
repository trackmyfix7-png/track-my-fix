import { cn } from '@/lib/utils'
import type { ServiceOrderStatus } from '@/types/database'

const STEPS: { label: string; statuses: ServiceOrderStatus[] }[] = [
  { label: 'Recebido',    statuses: ['received']                        },
  { label: 'Diagnóstico', statuses: ['diagnosis', 'awaiting_approval']  },
  { label: 'Em serviço',  statuses: ['in_progress']                     },
  { label: 'Pronto',      statuses: ['ready']                           },
  { label: 'Entregue',    statuses: ['delivered']                       },
]

function getStepIndex(status: ServiceOrderStatus): number {
  return STEPS.findIndex((s) => s.statuses.includes(status))
}

interface VehicleStatusBarProps {
  status: ServiceOrderStatus
  inverted?: boolean
}

export function VehicleStatusBar({ status, inverted = false }: VehicleStatusBarProps) {
  const currentIndex = getStepIndex(status)
  const progress     = currentIndex / (STEPS.length - 1)

  return (
    <div className="relative pt-1">
      <div className={cn('absolute top-[11px] left-[16px] right-[16px] h-0.5', inverted ? 'bg-white/20' : 'bg-border')} />
      <div
        className="absolute top-[11px] left-[16px] h-0.5 bg-brand-accent transition-all duration-700"
        style={{ width: `calc(${progress * 100}% * ((100% - 32px) / 100%))` }}
      />

      <div className="relative flex justify-between">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentIndex
          const isCurrent   = i === currentIndex

          return (
            <div key={step.label} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300',
                  isCompleted
                    ? 'bg-brand-accent border-brand-accent'
                    : isCurrent
                      ? inverted
                        ? 'bg-brand-primary border-brand-accent shadow-sm shadow-brand-accent/40'
                        : 'bg-white border-brand-accent shadow-sm shadow-brand-accent/40'
                      : inverted
                        ? 'bg-white/10 border-white/25'
                        : 'bg-white border-border'
                )}
              >
                {isCompleted ? (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isCurrent ? (
                  <div className="h-[9px] w-[9px] rounded-full bg-brand-accent" />
                ) : null}
              </div>
              <span className={cn(
                'text-[10px] font-medium text-center leading-tight whitespace-nowrap',
                isCurrent
                  ? 'text-brand-accent font-semibold'
                  : isCompleted
                    ? inverted ? 'text-white/60' : 'text-foreground/70'
                    : inverted ? 'text-white/40' : 'text-muted-foreground'
              )}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
