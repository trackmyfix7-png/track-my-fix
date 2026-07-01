import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Car, CheckCircle2, XCircle, Loader2, Building2, Wrench,
  ImageIcon, X, ZoomIn, ChevronLeft, ChevronRight, ExternalLink, FileText,
} from 'lucide-react'
import { useBudget, useApproveBudget, useRejectBudget } from '../hooks/useBudgets'
import { BudgetItemsTable } from '../components/BudgetItemsTable'
import { BudgetStatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: budget, isLoading, isError, refetch } = useBudget(id!)
  const approve = useApproveBudget()
  const reject = useRejectBudget()

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState onRetry={refetch} />
  if (!budget) return <ErrorState title="Orçamento não encontrado" />

  const isPending = budget.status === 'awaiting_approval' || budget.status === 'requested'
  const isActing = approve.isPending || reject.isPending

  async function handleApprove() {
    await approve.mutateAsync(budget!.id)
  }

  async function handleReject() {
    await reject.mutateAsync(budget!.id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/orcamentos')}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para orçamentos
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-primary/10">
            {budget.vehicle?.photo_url ? (
              <img
                src={budget.vehicle.photo_url}
                alt={`${budget.vehicle.brand} ${budget.vehicle.model}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <Car className="h-6 w-6 text-brand-primary" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-brand-primary">
                Orçamento {budget.budget_number}
              </h1>
              <BudgetStatusBadge status={budget.status} />
            </div>
            {budget.service_request?.service?.name && (
              <p className="mt-0.5 text-base font-semibold text-foreground">
                {budget.service_request.service.name}
              </p>
            )}
            <p className="mt-0.5 text-sm text-muted-foreground">
              {budget.vehicle && `${budget.vehicle.brand} ${budget.vehicle.model}`}
              {budget.vehicle?.plate && (
                <span className="ml-1.5 font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                  {budget.vehicle.plate}
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Emitido em {formatDate(budget.issued_at)}
              {budget.valid_until && ` · Válido até ${formatDate(budget.valid_until + 'T00:00:00Z')}`}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de 3 colunas — serviço (1fr) | itens (2fr) | detalhes+ações (1fr) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">

        {/* Serviço solicitado — 1ª coluna */}
        <div>
          {budget.service_request && (
            <Card className="border-brand-secondary/30 bg-brand-secondary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-brand-secondary flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Serviço solicitado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {budget.service_request.service ? (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-3">
                      {budget.service_request.service.estimated_time && (
                        <span className="text-xs text-muted-foreground">
                          Tempo estimado:{' '}
                          <span className="font-medium text-foreground">
                            {budget.service_request.service.estimated_time}
                          </span>
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Preço de referência:{' '}
                        <span className="font-medium text-foreground">
                          {formatCurrency(budget.service_request.service.base_price)}
                        </span>
                      </span>
                    </div>
                    {budget.service_request.service.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {budget.service_request.service.description}
                      </p>
                    )}
                  </div>
                ) : budget.service_request.category ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {budget.service_request.category}
                  </Badge>
                ) : null}

                {budget.service_request.problem_description && (
                  <div className={budget.service_request.service ? 'border-t border-brand-secondary/20 pt-3' : ''}>
                    {budget.service_request.service && (
                      <p className="text-xs font-medium text-muted-foreground mb-1">Observações do cliente</p>
                    )}
                    <p className="text-sm text-foreground leading-relaxed">
                      {budget.service_request.problem_description}
                    </p>
                  </div>
                )}

                {budget.service_request.images && budget.service_request.images.length > 0 && (
                  <div className="border-t border-brand-secondary/20 pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5" />
                      Fotos
                    </p>
                    <ImageGallery images={budget.service_request.images} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Itens do orçamento — 2ª coluna (mais larga) */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-brand-primary flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Itens do orçamento
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {budget.items?.length ?? 0}{' '}
                  {(budget.items?.length ?? 0) === 1 ? 'item' : 'itens'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {budget.items && budget.items.length > 0 ? (
                <BudgetItemsTable items={budget.items} total={budget.total_amount} />
              ) : (
                <p className="px-6 py-8 text-sm text-center text-muted-foreground">
                  Nenhum item cadastrado.
                </p>
              )}
            </CardContent>
          </Card>

          {budget.workshop_notes && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-amber-800">
                  Observação da oficina
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700 leading-relaxed">{budget.workshop_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detalhes + ações */}
        <div>
          <Card>
            <CardContent className="p-5 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pb-1">
                Detalhes
              </p>
              <DetailLine label="Nº" value={budget.budget_number} mono />
              <DetailLine label="Emitido" value={formatDate(budget.issued_at)} />
              {budget.valid_until && (
                <DetailLine label="Válido até" value={formatDate(budget.valid_until + 'T00:00:00Z')} />
              )}
              <DetailLine label="Oficina" value={budget.workshop?.name ?? 'Oficina'} />
              <div className="pt-3 mt-1 border-t border-border/60 flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-2xl font-bold text-brand-accent">
                  {formatCurrency(budget.total_amount)}
                </span>
              </div>

              {isPending && (
                <div className="pt-3 space-y-2">
                  <Button
                    variant="accent"
                    className="w-full gap-2"
                    onClick={handleApprove}
                    disabled={isActing}
                  >
                    {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Aprovar orçamento
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
                    onClick={handleReject}
                    disabled={isActing}
                  >
                    {reject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Rejeitar orçamento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}

function DetailLine({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={cn('text-sm font-medium text-foreground text-right', mono && 'font-mono')}>{value}</span>
    </div>
  )
}

function PhotoThumb({ url, onClick }: { url: string; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <button
      onClick={onClick}
      className="group relative w-[72px] h-[72px] flex-shrink-0 overflow-hidden rounded-lg bg-muted border border-border/50"
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-muted-foreground/15 rounded-lg" />
      )}
      <img
        src={url}
        alt=""
        onLoad={() => setLoaded(true)}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-200',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-150 flex items-center justify-center rounded-lg">
        <ZoomIn className="h-3.5 w-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
      </div>
    </button>
  )
}

function ImageGallery({ images }: { images: Array<{ id: string; url?: string | null }> }) {
  const validImages = images.filter((img) => img.url != null)
  const [lightbox, setLightbox] = useState<number | null>(null)

  const goPrev = useCallback(() => {
    setLightbox((prev) => (prev !== null ? (prev - 1 + validImages.length) % validImages.length : null))
  }, [validImages.length])

  const goNext = useCallback(() => {
    setLightbox((prev) => (prev !== null ? (prev + 1) % validImages.length : null))
  }, [validImages.length])

  useEffect(() => {
    if (lightbox === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, goPrev, goNext])

  if (validImages.length === 0) return null

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {validImages.map((img, i) => (
          <PhotoThumb key={img.id} url={img.url!} onClick={() => setLightbox(i)} />
        ))}
      </div>

      {lightbox !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85"
            onClick={() => setLightbox(null)}
          >
            {/* Fechar */}
            <button
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              onClick={() => setLightbox(null)}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Anterior / Próximo */}
            {validImages.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/25 transition-colors"
                  onClick={(e) => { e.stopPropagation(); goPrev() }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/25 transition-colors"
                  onClick={(e) => { e.stopPropagation(); goNext() }}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Imagem */}
            <div
              className="relative flex items-center justify-center bg-white rounded-xl p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={validImages[lightbox].url!}
                alt=""
                className="max-h-[82vh] max-w-[82vw] rounded-lg object-contain"
              />
            </div>

            {/* Contador */}
            {validImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70 bg-black/30 px-3 py-1 rounded-full pointer-events-none">
                {lightbox + 1} / {validImages.length}
              </div>
            )}

            {/* Abrir em nova aba */}
            <a
              href={validImages[lightbox].url!}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>,
          document.body
        )}
    </>
  )
}
