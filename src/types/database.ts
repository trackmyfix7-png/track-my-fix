export type ServiceOrderStatus = 'received' | 'in_progress' | 'ready' | 'delivered'
export type BudgetStatus = 'requested' | 'awaiting_approval' | 'approved' | 'rejected' | 'completed'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue'
export type ServiceRequestStatus = 'pending' | 'analyzing' | 'budget_created'
export type NotificationType =
  | 'budget_created'
  | 'budget_approved'
  | 'service_completed'
  | 'payment_registered'

export type UserRole = 'admin' | 'client'

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Workshop {
  id: string
  name: string
  slug: string
  owner_id: string
  address: string | null
  phone: string | null
  cnpj: string | null
  created_at: string
}

export interface ClientWorkshop {
  id: string
  client_id: string
  workshop_id: string
  linked_at: string
  workshop?: Workshop
}

export interface Vehicle {
  id: string
  owner_id: string
  brand: string
  model: string
  year: number
  plate: string
  color: string | null
  mileage: number | null
  notes: string | null
  photo_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ServiceOrder {
  id: string
  vehicle_id: string
  status: ServiceOrderStatus
  entry_date: string
  exit_date: string | null
  service_description?: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
}

export interface BudgetItem {
  id: string
  budget_id: string
  description: string
  category: string
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
  status: BudgetStatus
  total_amount: number
  valid_until: string | null
  workshop_notes: string | null
  issued_at: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  items?: BudgetItem[]
}

export interface Invoice {
  id: string
  invoice_number: string
  budget_id: string | null
  vehicle_id: string
  service_description: string
  amount: number
  status: InvoiceStatus
  issued_at: string
  due_date: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  vehicle?: Vehicle
}

export interface Service {
  id: string
  name: string
  description: string | null
  estimated_time_days: number | null
  base_price: number
  is_active: boolean
  created_at: string
}

export interface ServiceRequest {
  id: string
  owner_id: string
  vehicle_id: string
  category: string
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

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  reference_id: string | null
  reference_type: string | null
  created_at: string
}

export interface DashboardSummary {
  activeVehicles: number
  pendingBudgets: number
  pendingBudgetsAmount: number
  totalHistory: number
}
