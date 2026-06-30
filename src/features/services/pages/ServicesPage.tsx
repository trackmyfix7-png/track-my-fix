import { useState, useMemo } from 'react'
import { Search, Clock, Wrench, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchServices } from '../services/catalog.service'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'

export function ServicesPage() {
  const navigate = useNavigate()
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState<string | null>(null)

  const { data: services = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['services'],
    queryFn:  () => fetchServices(),
  })

  const categories = useMemo(
    () => [...new Set(services.map((s) => s.category).filter(Boolean) as string[])].sort(),
    [services]
  )

  const filtered = useMemo(() => services.filter((s) => {
    if (catFilter && s.category !== catFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q)
    }
    return true
  }), [services, catFilter, search])

  if (isLoading) return <LoadingState />
  if (isError)   return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Nossos serviços"
        description="Consulte os serviços disponíveis e solicite um orçamento"
        actions={
          <Button variant="accent" size="sm" onClick={() => navigate('/solicitar-orcamento')}>
            Orçamento livre
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        }
      />

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

      {/* Filtros de categoria */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCatFilter(null)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors border',
              catFilter === null
                ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                : 'border-border bg-white text-muted-foreground hover:border-brand-primary/40 hover:text-brand-primary'
            )}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button key={cat}
              onClick={() => setCatFilter(cat === catFilter ? null : cat)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors border',
                catFilter === cat
                  ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                  : 'border-border bg-white text-muted-foreground hover:border-brand-primary/40 hover:text-brand-primary'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum serviço encontrado"
          description={search ? `Nenhum resultado para "${search}"` : 'Nenhum serviço disponível no momento.'}
          className="py-16"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((service) => (
            <Card key={service.id}
              className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col flex-1 p-5 gap-3">

                {/* Cabeçalho */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
                      <Wrench className="h-4 w-4 text-brand-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground leading-snug">{service.name}</h3>
                  </div>
                  {service.category && (
                    <span className="flex-shrink-0 rounded-full bg-brand-secondary/10 px-2.5 py-0.5 text-xs font-medium text-brand-secondary whitespace-nowrap">
                      {service.category}
                    </span>
                  )}
                </div>

                {/* Descrição */}
                {service.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {service.description}
                  </p>
                )}

                {/* Rodapé — preço + prazo + ação */}
                <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-brand-accent">
                      {formatCurrency(service.base_price)}
                    </span>
                    {service.estimated_time && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        {service.estimated_time}
                      </span>
                    )}
                  </div>
                  <Button variant="outline" size="sm"
                    onClick={() => navigate('/solicitar-orcamento', {
                      state: { serviceName: service.name, category: service.category },
                    })}
                  >
                    Solicitar
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
