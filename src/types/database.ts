// Status da ordem de serviço — alinhado com o banco
export type ServiceOrderStatus =
  | 'received'
  | 'diagnosis'
  | 'awaiting_approval'
  | 'in_progress'
  | 'ready'
  | 'delivered'

export type BudgetStatus = 'awaiting_approval' | 'approved' | 'rejected' | 'completed'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue'
export type ServiceRequestStatus = 'pending' | 'analyzing' | 'budget_created'
export type NotificationType =
  | 'budget_created'
  | 'budget_approved'
  | 'budget_rejected'
  | 'status_changed'
  | 'service_completed'
  | 'payment_registered'
  | 'service_request_received'

export type UserRole = 'admin' | 'client' | 'employee'

export const SERVICE_ORDER_STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  received:           'Recebido',
  diagnosis:          'Diagnóstico',
  awaiting_approval:  'Aguard. aprovação',
  in_progress:        'Em serviço',
  ready:              'Pronto',
  delivered:          'Entregue',
}

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  awaiting_approval: 'Aguardando aprovação',
  approved:          'Aprovado',
  rejected:          'Recusado',
  completed:         'Concluído',
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  pending:  'Pendente',
  paid:     'Pago',
  overdue:  'Vencido',
}

// ─── Perfis ───────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

// ─── Oficinas ─────────────────────────────────────────────────────────────────

export interface Workshop {
  id: string
  name: string
  slug: string
  owner_id: string
  address: string | null
  phone: string | null
  cnpj: string | null
  capacity: number | null
  created_at: string
}

export interface ClientWorkshop {
  id: string
  client_id: string
  workshop_id: string
  linked_at: string
  workshop?: Workshop
}

export interface WorkshopEmployee {
  id: string
  employee_id: string
  workshop_id: string
  linked_at: string
  employee?: Profile
  workshop?: Workshop
}

// ─── Veículos ─────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string
  owner_id: string
  brand: string
  model: string
  year: number
  plate: string
  color: string | null
  fuel_type: string | null
  mileage: number | null
  notes: string | null
  photo_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Ordens de serviço ────────────────────────────────────────────────────────

export interface ServiceOrder {
  id: string
  vehicle_id: string
  workshop_id: string
  status: ServiceOrderStatus
  entry_date: string
  exit_date: string | null
  problem_description: string | null
  workshop_notes: string | null
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  workshop?: Workshop
}

export interface ServiceOrderStatusHistory {
  id: string
  service_order_id: string
  status: ServiceOrderStatus
  notes: string | null
  changed_by: string
  changed_at: string
  profile?: Profile
}

export interface EntryChecklist {
  id: string
  service_order_id: string
  item: string
  is_ok: boolean
  notes: string | null
  checked_at: string | null
  created_at: string
}

// ─── Orçamentos ───────────────────────────────────────────────────────────────

export interface BudgetItem {
  id: string
  budget_id: string
  description: string
  category: 'part' | 'service' | 'labor'
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface Budget {
  id: string
  budget_number: string
  vehicle_id: string
  service_order_id: string | null
  workshop_id: string
  status: BudgetStatus
  total_amount: number
  valid_until: string | null
  workshop_notes: string | null
  issued_at: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  workshop?: Workshop
  items?: BudgetItem[]
}

// ─── Faturas ──────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string
  invoice_number: string
  budget_id: string | null
  vehicle_id: string
  workshop_id: string
  service_description: string
  amount: number
  status: InvoiceStatus
  issued_at: string
  due_date: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  workshop?: Workshop
}

// ─── Catálogo de serviços ─────────────────────────────────────────────────────

export interface Service {
  id: string
  workshop_id: string
  name: string
  description: string | null
  category: string | null
  estimated_time: string | null
  base_price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Solicitações de orçamento ────────────────────────────────────────────────

export interface ServiceRequest {
  id: string
  owner_id: string
  workshop_id: string
  vehicle_id: string
  category: string | null
  problem_description: string
  status: ServiceRequestStatus
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  images?: ServiceRequestImage[]
}

export interface ServiceRequestImage {
  id: string
  request_id: string
  storage_path: string
  created_at: string
}

// ─── Notificações ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  user_id: string
  workshop_id: string | null
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  reference_id: string | null
  reference_type: string | null
  created_at: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  activeVehicles: number
  pendingBudgets: number
  pendingBudgetsAmount: number
  totalHistory: number
}
