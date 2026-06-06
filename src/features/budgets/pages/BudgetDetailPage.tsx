import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Car, CheckCircle2, XCircle, Loader2, Building2 } from 'lucide-react'
import { useBudget, useApproveBudget, useRejectBudget } from '../hooks/useBudgets'
import { BudgetItemsTable } from '../components/BudgetItemsTable'
import { BudgetStatusBadge } from '@/components/shared/StatusBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'

export function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: budget, isLoading, isError, refetch } = useBudget(id!)
  const approve = useApproveBudget()
  const reject = useRejectBudget()

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState onRetry={refetch} />
  if (!budget) return <ErrorState title="Orçamento não encontrado" />

  const isPending =
    budget.status === 'awaiting_approval' || budget.status === 'requested'
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
          {/* Foto do veículo */}
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

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-brand-primary">
                Orçamento {budget.budget_number}
              </h1>
              <BudgetStatusBadge status={budget.status} />
            </div>
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Items — main column */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-brand-primary flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Itens do orçamento
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {budget.items?.length ?? 0} {(budget.items?.length ?? 0) === 1 ? 'item' : 'itens'}
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

          {/* Workshop notes */}
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

        {/* Details sidebar */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-brand-primary flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Detalhes do orçamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Nº orçamento" value={budget.budget_number} />
              <Separator />
              <DetailRow label="Emitido em" value={formatDate(budget.issued_at)} />
              {budget.valid_until && (
                <>
                  <Separator />
                  <DetailRow
                    label="Válido até"
                    value={formatDate(budget.valid_until + 'T00:00:00Z')}
                  />
                </>
              )}
              <Separator />
              <DetailRow label="Oficina" value="João Mecânica" />
              <Separator />
              <div className="pt-1">
                <p className="text-xs text-muted-foreground">Valor total</p>
                <p className="text-2xl font-bold text-brand-accent mt-0.5">
                  {formatCurrency(budget.total_amount)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          {isPending && (
            <div className="space-y-2.5">
              <Button
                variant="accent"
                className="w-full gap-2"
                onClick={handleApprove}
                disabled={isActing}
              >
                {approve.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Aprovar orçamento
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
                onClick={handleReject}
                disabled={isActing}
              >
                {reject.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Rejeitar orçamento
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
