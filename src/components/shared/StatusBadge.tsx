import { Badge } from '@/components/ui/badge'
import type { BudgetStatus, InvoiceStatus, ServiceOrderStatus, ServiceRequestStatus } from '@/types/database'

const budgetStatusMap: Record<BudgetStatus, { label: string; variant: 'accent' | 'success' | 'destructive' | 'muted' | 'secondary' }> = {
  requested: { label: 'Solicitado', variant: 'muted' },
  awaiting_approval: { label: 'Aguardando aprovação', variant: 'accent' },
  approved: { label: 'Aprovado', variant: 'success' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
  completed: { label: 'Concluído', variant: 'secondary' },
}

const invoiceStatusMap: Record<InvoiceStatus, { label: string; variant: 'accent' | 'success' | 'destructive' }> = {
  pending: { label: 'Pendente', variant: 'accent' },
  paid: { label: 'Pago', variant: 'success' },
  overdue: { label: 'Vencido', variant: 'destructive' },
}

const serviceOrderStatusMap: Record<ServiceOrderStatus, { label: string; variant: 'muted' | 'secondary' | 'accent' | 'success' }> = {
  received:          { label: 'Recebido',            variant: 'muted'      },
  diagnosis:         { label: 'Diagnóstico',          variant: 'secondary'  },
  awaiting_approval: { label: 'Aguard. aprovação',   variant: 'accent'     },
  in_progress:       { label: 'Em processo',          variant: 'secondary'  },
  ready:             { label: 'Pronto',               variant: 'accent'     },
  delivered:         { label: 'Entregue',             variant: 'success'    },
}

export function StatusBadge({ status, className }: { status: ServiceOrderStatus; className?: string }) {
  return <ServiceOrderStatusBadge status={status} className={className} />
}

const serviceRequestStatusMap: Record<ServiceRequestStatus, { label: string; variant: 'muted' | 'secondary' | 'success' }> = {
  pending: { label: 'Aguardando análise', variant: 'muted' },
  analyzing: { label: 'Em análise', variant: 'secondary' },
  budget_created: { label: 'Orçamento gerado', variant: 'success' },
}

interface BudgetStatusBadgeProps {
  status: BudgetStatus
  className?: string
}

export function BudgetStatusBadge({ status, className }: BudgetStatusBadgeProps) {
  const { label, variant } = budgetStatusMap[status]
  return <Badge variant={variant} className={className}>{label}</Badge>
}

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  className?: string
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const { label, variant } = invoiceStatusMap[status]
  return <Badge variant={variant} className={className}>{label}</Badge>
}

interface ServiceOrderStatusBadgeProps {
  status: ServiceOrderStatus
  className?: string
}

export function ServiceOrderStatusBadge({ status, className }: ServiceOrderStatusBadgeProps) {
  const { label, variant } = serviceOrderStatusMap[status]
  return <Badge variant={variant} className={className}>{label}</Badge>
}

interface ServiceRequestStatusBadgeProps {
  status: ServiceRequestStatus
  className?: string
}

export function ServiceRequestStatusBadge({ status, className }: ServiceRequestStatusBadgeProps) {
  const { label, variant } = serviceRequestStatusMap[status]
  return <Badge variant={variant} className={className}>{label}</Badge>
}
