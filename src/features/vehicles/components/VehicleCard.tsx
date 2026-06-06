import { Car, MapPin } from 'lucide-react'
import type { Vehicle, ServiceOrder } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { VehicleStatusBar } from './VehicleStatusBar'
import { formatDate } from '@/lib/utils'

interface VehicleCardProps {
  vehicle: Vehicle
  activeOrder?: ServiceOrder
}

export function VehicleCard({ vehicle, activeOrder }: VehicleCardProps) {
  return (
    <Card className="border-l-4 border-l-brand-secondary">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary/10 flex-shrink-0 overflow-hidden">
              {vehicle.photo_url ? (
                <img
                  src={vehicle.photo_url}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Car className="h-5 w-5 text-brand-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-brand-primary">
                {vehicle.brand} {vehicle.model}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                  {vehicle.plate}
                </span>
                {vehicle.mileage && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {vehicle.mileage.toLocaleString('pt-BR')} km
                  </span>
                )}
                {vehicle.color && (
                  <span className="text-xs text-muted-foreground">{vehicle.color}</span>
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
          <div className="mt-5 rounded-lg bg-muted/50 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Progresso do serviço
            </p>
            <VehicleStatusBar status={activeOrder.status} />
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">Entrada:</span>{' '}
                {formatDate(activeOrder.entry_date)}
              </span>
              {activeOrder.service_description && (
                <span className="truncate">
                  <span className="font-medium text-foreground">Serviço:</span>{' '}
                  {activeOrder.service_description}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
