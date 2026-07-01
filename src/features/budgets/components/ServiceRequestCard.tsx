import { Clock, Car } from 'lucide-react'
import type { ServiceRequest } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface ServiceRequestCardProps {
  request: ServiceRequest
}

export function ServiceRequestCard({ request }: ServiceRequestCardProps) {
  const vehicle = request.vehicle

  return (
    <Card className="border-l-4 border-l-amber-400/70 h-full">
      <CardContent className="px-5 pt-5 pb-4 flex flex-col h-full">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted mt-0.5">
            {vehicle?.photo_url ? (
              <img
                src={vehicle.photo_url}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <Car className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-sm text-brand-primary truncate">
                {vehicle ? `${vehicle.brand} ${vehicle.model}` : '—'}
              </span>
              {vehicle?.plate && (
                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {vehicle.plate}
                </span>
              )}
              {request.category && (
                <Badge variant="secondary" className="text-[10px] py-0 h-4">
                  {request.category}
                </Badge>
              )}
            </div>

            <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-snug">
              {request.problem_description}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {formatDate(request.created_at)}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            <Clock className="h-3 w-3" />
            Aguardando orçamento
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
