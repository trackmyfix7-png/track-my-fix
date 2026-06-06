import { Clock, Car, ChevronRight } from 'lucide-react'
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
    <Card className="border-l-4 border-l-muted-foreground/30 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">

          {/* Esquerda: foto + veículo + descrição */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Thumbnail do veículo */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
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

            <div className="min-w-0">
              {/* Linha 1: veículo + badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-sm text-brand-primary truncate">
                  {vehicle ? `${vehicle.brand} ${vehicle.model}` : '—'}
                </span>
                {vehicle?.plate && (
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {vehicle.plate}
                  </span>
                )}
                <Badge variant="secondary" className="text-[10px] py-0 h-4">
                  {request.category}
                </Badge>
              </div>

              {/* Linha 2: descrição do problema */}
              <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2 leading-snug">
                {request.problem_description}
              </p>

              {/* Linha 3: data + status */}
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Solicitado em {formatDate(request.created_at)}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                  <Clock className="h-3 w-3" />
                  Aguardando orçamento
                </span>
              </div>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
        </div>
      </CardContent>
    </Card>
  )
}
