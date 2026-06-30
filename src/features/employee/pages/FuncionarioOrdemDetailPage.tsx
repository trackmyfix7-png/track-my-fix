import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Car, User, Clock, ClipboardList } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ServiceOrderStatusBadge } from '@/components/shared/StatusBadge'
import { cn, getInitials } from '@/lib/utils'
import { useEmployeeOrderDetail, useEmployeeUpdateStatus } from '../hooks/useEmployee'
import type { ServiceOrderStatus } from '@/types/database'

// ─── Status options (sem 'delivered' neste portal — admin confirma entrega) ──

const STATUS_OPTIONS: { value: ServiceOrderStatus; label: string }[] = [
  { value: 'received',          label: 'Recebido'          },
  { value: 'diagnosis',         label: 'Diagnóstico'        },
  { value: 'awaiting_approval', label: 'Aguard. aprovação' },
  { value: 'in_progress',       label: 'Em processo'       },
  { value: 'ready',             label: 'Pronto'            },
]

// ─── Timeline entry ────────────────────────────────────────────────────────────

function TimelineEntry({
  status, notes, changedAt, changerName, isLast,
}: {
  status:      ServiceOrderStatus
  notes:       string | null
  changedAt:   string
  changerName: string | null
  isLast:      boolean
}) {
  return (
    <div className="relative flex gap-4">
      {!isLast && <span className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />}
      <span className={cn(
        'mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2',
        isLast ? 'border-brand-secondary bg-brand-secondary' : 'border-border bg-background'
      )} />
      <div className="pb-5 space-y-1">
        <ServiceOrderStatusBadge status={status} />
        <p className="text-xs text-muted-foreground">
          {format(parseISO(changedAt), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
          {changerName ? ` · ${changerName}` : ''}
        </p>
        {notes && (
          <p className="mt-1 rounded-md bg-muted/60 px-3 py-2 text-sm text-foreground">{notes}</p>
        )}
      </div>
    </div>
  )
}

// ─── Row helper ───────────────────────────────────────────────────────────────

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-medium text-right', mono && 'font-mono text-xs bg-muted px-2 py-0.5 rounded')}>
        {value}
      </span>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function FuncionarioOrdemDetailPage() {
  const { id: orderId } = useParams<{ id: string }>()

  const { data: order, isLoading, isError, refetch } = useEmployeeOrderDetail(orderId ?? '')
  const updateStatus = useEmployeeUpdateStatus()

  const [newStatus, setNewStatus] = useState<ServiceOrderStatus | ''>('')
  const [notes,     setNotes]     = useState('')

  if (isLoading)     return <LoadingState />
  if (isError || !order) return <ErrorState onRetry={refetch} />

  const v       = order.vehicle
  const history = [...(order.history ?? [])].sort(
    (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
  )
  const daysIn = differenceInDays(new Date(), parseISO(order.entry_date))

  async function handleUpdate() {
    if (!newStatus || !orderId) return
    await updateStatus.mutateAsync({ orderId, status: newStatus, notes: notes || null })
    setNewStatus('')
    setNotes('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${v.brand} ${v.model} ${v.year}`}
        description={`Placa ${v.plate}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/funcionario/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Coluna esquerda */}
        <div className="space-y-4 lg:col-span-1">

          {/* Veículo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <Car className="h-4 w-4" /> Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Row label="Modelo"    value={`${v.brand} ${v.model} ${v.year}`} />
              <Row label="Placa"     value={v.plate} mono />
              {v.color     && <Row label="Cor"         value={v.color}     />}
              {v.fuel_type && <Row label="Combustível" value={v.fuel_type} />}
              {v.mileage   && <Row label="Km"          value={v.mileage.toLocaleString('pt-BR')} />}
            </CardContent>
          </Card>

          {/* Cliente */}
          {v.owner && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <User className="h-4 w-4" /> Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-sm font-semibold">
                      {getInitials(v.owner.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{v.owner.full_name}</p>
                    {v.owner.phone && (
                      <p className="text-xs text-muted-foreground">{v.owner.phone}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Na oficina há{' '}
                  <span className={cn('font-semibold', daysIn >= 4 ? 'text-brand-accent' : 'text-foreground')}>
                    {daysIn === 0 ? 'menos de 1 dia' : `${daysIn} dia${daysIn > 1 ? 's' : ''}`}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status atual</span>
                <ServiceOrderStatusBadge status={order.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Entrada</span>
                <span className="text-sm font-medium">
                  {format(parseISO(order.entry_date), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita */}
        <div className="space-y-4 lg:col-span-2">

          {/* Problema relatado */}
          {order.problem_description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Problema relatado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{order.problem_description}</p>
              </CardContent>
            </Card>
          )}

          {/* Atualizar status */}
          {order.status !== 'delivered' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Atualizar status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Novo status</Label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ServiceOrderStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.filter((o) => o.value !== order.status).map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Observações (opcional)</Label>
                  <Textarea
                    placeholder="Descreva o que foi feito ou o motivo da mudança..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button
                  variant="accent"
                  disabled={!newStatus || updateStatus.isPending}
                  onClick={handleUpdate}
                >
                  {updateStatus.isPending ? 'Salvando...' : 'Salvar atualização'}
                </Button>
                {updateStatus.isError && (
                  <p className="text-xs text-destructive">Erro ao salvar. Tente novamente.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Histórico */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <Clock className="h-4 w-4" /> Histórico de status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {history.map((entry, i) => (
                  <TimelineEntry
                    key={entry.id}
                    status={entry.status as ServiceOrderStatus}
                    notes={entry.notes}
                    changedAt={entry.changed_at}
                    changerName={entry.changer?.full_name ?? null}
                    isLast={i === history.length - 1}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Check-list */}
          {order.checklist && order.checklist.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <ClipboardList className="h-4 w-4" /> Check-list de entrada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {order.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-md px-2 py-1.5">
                    <span className={cn(
                      'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      item.is_ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    )}>
                      {item.is_ok ? '✓' : '✗'}
                    </span>
                    <span className="flex-1 text-sm text-foreground">{item.item}</span>
                    {item.notes && (
                      <span className="text-xs text-muted-foreground">{item.notes}</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
