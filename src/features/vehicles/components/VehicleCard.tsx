import { Car, MapPin } from 'lucide-react'
import type { Vehicle, ServiceOrder } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { VehicleStatusBar } from './VehicleStatusBar'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface VehicleCardProps {
  vehicle: Vehicle
  activeOrder?: ServiceOrder
  variant?: 'default' | 'active'
}

export function VehicleCard({ vehicle, activeOrder, variant = 'default' }: VehicleCardProps) {
  const isActive = variant === 'active' && !!activeOrder

  return (
    <Card
      className={cn(
        'overflow-hidden',
        isActive
          ? 'border-brand-primary/30 bg-brand-primary text-white'
          : 'border-l-4 border-l-brand-secondary'
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full flex-shrink-0 overflow-hidden',
                isActive ? 'bg-white/15' : 'bg-brand-primary/10'
              )}
            >
              {vehicle.photo_url ? (
                <img
                  src={vehicle.photo_url}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Car className={cn('h-5 w-5', isActive ? 'text-white/80' : 'text-brand-primary')} />
              )}
            </div>
            <div>
              <h3 className={cn('font-semibold', isActive ? 'text-white' : 'text-brand-primary')}>
                {vehicle.brand} {vehicle.model} {vehicle.year}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span
                  className={cn(
                    'text-xs font-mono px-1.5 py-0.5 rounded',
                    isActive ? 'bg-white/15 text-white/80' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {vehicle.plate}
                </span>
                {vehicle.mileage && (
                  <span className={cn('text-xs flex items-center gap-1', isActive ? 'text-white/70' : 'text-muted-foreground')}>
                    <MapPin className="h-3 w-3" />
                    {vehicle.mileage.toLocaleString('pt-BR')} km
                  </span>
                )}
              </div>
            </div>
          </div>
          {activeOrder && (
            <span className="flex-shrink-0 rounded-full bg-brand-accent px-2.5 py-0.5 text-xs font-semibold text-white">
              Em serviço
            </span>
          )}
        </div>

        {activeOrder && (
          <div className={cn('mt-4 rounded-lg p-4', isActive ? 'bg-white/10' : 'bg-muted/50')}>
            <VehicleStatusBar status={activeOrder.status} inverted={isActive} />
            <div className={cn('mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs', isActive ? 'text-white/70' : 'text-muted-foreground')}>
              <span>
                <span className={cn('font-medium', isActive ? 'text-white/90' : 'text-foreground')}>
                  Entrada:
                </span>{' '}
                {formatDate(activeOrder.entry_date)}
              </span>
              {(activeOrder.problem_description || activeOrder.service_description) && (
                <span className="truncate">
                  <span className={cn('font-medium', isActive ? 'text-white/90' : 'text-foreground')}>
                    Prob:
                  </span>{' '}
                  {activeOrder.problem_description ?? activeOrder.service_description}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
