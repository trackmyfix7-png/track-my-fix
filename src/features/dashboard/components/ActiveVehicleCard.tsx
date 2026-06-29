import { Car, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ServiceOrder } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VehicleStatusBar } from '@/features/vehicles/components/VehicleStatusBar'
import { formatDate } from '@/lib/utils'

interface ActiveVehicleCardProps {
  order: ServiceOrder
}

export function ActiveVehicleCard({ order }: ActiveVehicleCardProps) {
  const v = order.vehicle

  return (
    <Card className="border-l-4 border-l-brand-secondary overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-brand-primary">
            Na oficina agora
          </CardTitle>
          <Link
            to="/veiculos"
            className="text-xs text-brand-secondary hover:underline font-medium"
          >
            Ver detalhes →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-brand-primary/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 flex-shrink-0 overflow-hidden">
                {v?.photo_url ? (
                  <img
                    src={v.photo_url}
                    alt={`${v.brand} ${v.model}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Car className="h-5 w-5 text-brand-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold text-brand-primary text-sm">
                  {v ? `${v.brand} ${v.model}` : '—'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {v?.plate && (
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                      {v.plate}
                    </span>
                  )}
                  {v?.mileage && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {v.mileage.toLocaleString('pt-BR')} km
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="flex-shrink-0 rounded-full bg-brand-accent px-2.5 py-0.5 text-xs font-semibold text-white">
              Em serviço
            </span>
          </div>

          <div className="mt-5">
            <VehicleStatusBar status={order.status} />
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">Entrada:</span>{' '}
              {formatDate(order.entry_date)}
            </span>
            {order.problem_description && (
              <span className="truncate">
                <span className="font-medium text-foreground">Problema:</span>{' '}
                {order.problem_description}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
