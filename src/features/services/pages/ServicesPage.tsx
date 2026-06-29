import { useState } from 'react'
import { Search, Clock, Wrench, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchServices } from '../services/catalog.service'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

export function ServicesPage() {
  const [search, setSearch] = useState('')

  const { data: services, isLoading, isError, refetch } = useQuery({
    queryKey: ['services', search],
    queryFn: () => fetchServices(search),
  })

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tabela de serviços"
        description="Consulte os serviços disponíveis e solicite um orçamento"
      />

      {/* CTA banner */}
      <Card className="border-brand-secondary/30 bg-gradient-to-r from-brand-secondary/5 to-brand-primary/5">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <p className="text-sm text-muted-foreground">
            Não encontrou o que precisa?{' '}
            <span className="font-medium text-brand-secondary">
              Solicite um orçamento personalizado
            </span>
          </p>
          <Link
            to="/solicitar-orcamento"
            className="flex items-center gap-1.5 rounded-md bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-accent/90 transition-colors flex-shrink-0"
          >
            Solicitar <ArrowRight className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar serviço..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {services && services.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Prazo est.</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-3.5 w-3.5 text-brand-secondary flex-shrink-0" />
                        {service.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px]">
                      {service.description ?? '—'}
                    </TableCell>
                    <TableCell>
                      {service.estimated_time ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {service.estimated_time}
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-brand-accent">
                        {formatCurrency(service.base_price)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Search}
              title="Nenhum serviço encontrado"
              description={search ? `Nenhum resultado para "${search}"` : 'Nenhum serviço cadastrado.'}
              className="py-12"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
