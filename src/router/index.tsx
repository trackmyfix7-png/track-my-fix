import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/shared/LoadingState'

import { LoginPage } from '@/features/auth/pages/LoginPage'
import { WorkshopEntryPage } from '@/features/auth/pages/WorkshopEntryPage'
import { EmployeeInvitePage } from '@/features/auth/pages/EmployeeInvitePage'
import { WorkshopRegistrationPage } from '@/features/auth/pages/WorkshopRegistrationPage'
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage'
import { AuthErrorPage } from '@/features/auth/pages/AuthErrorPage'
import { AdminOnboardingPage } from '@/features/admin/onboarding/pages/AdminOnboardingPage'

import { AdminSettingsPage } from '@/features/admin/settings/pages/AdminSettingsPage'
import { AdminDashboardPage } from '@/features/admin/dashboard/pages/AdminDashboardPage'
import { AdminFinanceiroPage } from '@/features/admin/financeiro/pages/AdminFinanceiroPage'
import { AdminOrcamentosPage } from '@/features/admin/orcamentos/pages/AdminOrcamentosPage'
import { AdminClientesPage } from '@/features/admin/clientes/pages/AdminClientesPage'
import { AdminVeiculosPage } from '@/features/admin/veiculos/pages/AdminVeiculosPage'
import { AdminVeiculoNovoPage } from '@/features/admin/veiculos/pages/AdminVeiculoNovoPage'
import { AdminVeiculoDetailPage } from '@/features/admin/veiculos/pages/AdminVeiculoDetailPage'
import { AdminFuncionariosPage } from '@/features/admin/funcionarios/pages/AdminFuncionariosPage'
import { FuncionarioDashboardPage } from '@/features/employee/pages/FuncionarioDashboardPage'
import { FuncionarioOrdensPage } from '@/features/employee/pages/FuncionarioOrdensPage'
import { FuncionarioOrdemDetailPage } from '@/features/employee/pages/FuncionarioOrdemDetailPage'
import { FuncionarioVeiculosPage } from '@/features/employee/pages/FuncionarioVeiculosPage'
import { FuncionarioOrcamentosPage } from '@/features/employee/pages/FuncionarioOrcamentosPage'
import { FuncionarioConfiguracoesPage } from '@/features/employee/pages/FuncionarioConfiguracoesPage'
import { AdminServicosPage } from '@/features/admin/servicos/pages/AdminServicosPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { VehiclesPage } from '@/features/vehicles/pages/VehiclesPage'
import { BudgetsPage } from '@/features/budgets/pages/BudgetsPage'
import { BudgetDetailPage } from '@/features/budgets/pages/BudgetDetailPage'
import { ServicesPage } from '@/features/services/pages/ServicesPage'
import { ServiceRequestPage } from '@/features/service-requests/pages/ServiceRequestPage'

// Redireciona para o portal correto conforme o role
function HomeRedirect() {
  const { isLoading, isAuthenticated, role } = useAuthContext()
  if (isLoading) return <LoadingState className="h-screen" />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role === 'admin')    return <Navigate to="/admin/dashboard"     replace />
  if (role === 'employee') return <Navigate to="/funcionario/dashboard" replace />
  return <Navigate to="/dashboard" replace />
}

// Rotas públicas (login, entry): se autenticado, redireciona
function PublicLayout() {
  const { isAuthenticated, isLoading, role } = useAuthContext()
  if (isLoading) return <LoadingState className="h-screen" />
  if (isAuthenticated) {
    const dest =
      role === 'admin'    ? '/admin/dashboard' :
      role === 'employee' ? '/funcionario/dashboard' :
      '/dashboard'
    return <Navigate to={dest} replace />
  }
  return <Outlet />
}

// Portal do cliente — exige role='client' com pelo menos um vínculo
function ClientLayout() {
  const { isAuthenticated, isLoading, role } = useAuthContext()
  if (isLoading) return <LoadingState className="h-screen" />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role === 'admin')    return <Navigate to="/admin/dashboard"      replace />
  if (role === 'employee') return <Navigate to="/funcionario/dashboard" replace />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

// Onboarding — só exige autenticação (role ainda pode ser 'client' neste momento)
function OnboardingRoute() {
  const { isAuthenticated, isLoading } = useAuthContext()
  if (isLoading) return <LoadingState className="h-screen" />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

// Painel da oficina (admin)
function AdminLayout() {
  const { isAuthenticated, isLoading, role } = useAuthContext()
  if (isLoading) return <LoadingState className="h-screen" />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role !== 'admin') return <Navigate to="/dashboard" replace />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

// Portal do funcionário
function EmployeeLayout() {
  const { isAuthenticated, isLoading, role } = useAuthContext()
  if (isLoading) return <LoadingState className="h-screen" />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role !== 'employee') return <Navigate to="/" replace />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

const router = createBrowserRouter([
  // Raiz
  { path: '/', element: <HomeRedirect /> },

  // Callback OAuth — sempre acessível
  { path: '/auth/callback', element: <AuthCallbackPage /> },

  // Sem acesso — cliente sem vínculo
  { path: '/sem-acesso', element: <AuthErrorPage /> },

  // Entrada do cliente via link da oficina — sempre acessível
  { path: '/acesso/:slug', element: <WorkshopEntryPage /> },

  // Convite de funcionário via link — sempre acessível
  { path: '/convite-funcionario/:slug', element: <EmployeeInvitePage /> },

  // Rotas públicas
  {
    element: <PublicLayout />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },

  // Registro de oficina — standalone (controla próprios redirects)
  { path: '/registro-oficina', element: <WorkshopRegistrationPage /> },

  // Onboarding da oficina (autenticado, sem exigir role=admin ainda)
  {
    element: <OnboardingRoute />,
    children: [{ path: '/admin/onboarding', element: <AdminOnboardingPage /> }],
  },

  // Portal do cliente
  {
    element: <ClientLayout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/veiculos', element: <VehiclesPage /> },
      { path: '/orcamentos', element: <BudgetsPage /> },
      { path: '/orcamentos/:id', element: <BudgetDetailPage /> },
      { path: '/servicos', element: <ServicesPage /> },
      { path: '/solicitar-orcamento', element: <ServiceRequestPage /> },
    ],
  },

  // Painel da oficina (admin)
  {
    element: <AdminLayout />,
    children: [
      { path: '/admin/dashboard', element: <AdminDashboardPage /> },
      { path: '/admin/veiculos', element: <AdminVeiculosPage /> },
      { path: '/admin/veiculos/novo', element: <AdminVeiculoNovoPage /> },
      { path: '/admin/veiculos/:id', element: <AdminVeiculoDetailPage /> },
      { path: '/admin/financeiro', element: <AdminFinanceiroPage /> },
      { path: '/admin/orcamentos', element: <AdminOrcamentosPage /> },
      { path: '/admin/clientes',      element: <AdminClientesPage />     },
      { path: '/admin/funcionarios',  element: <AdminFuncionariosPage /> },
      { path: '/admin/servicos', element: <AdminServicosPage /> },
      { path: '/admin/configuracoes', element: <AdminSettingsPage /> },
    ],
  },

  // Portal do funcionário
  {
    element: <EmployeeLayout />,
    children: [
      { path: '/funcionario',                element: <Navigate to="/funcionario/dashboard" replace /> },
      { path: '/funcionario/dashboard',      element: <FuncionarioDashboardPage /> },
      { path: '/funcionario/ordens',         element: <FuncionarioOrdensPage /> },
      { path: '/funcionario/ordens/:id',     element: <FuncionarioOrdemDetailPage /> },
      { path: '/funcionario/veiculos',       element: <FuncionarioVeiculosPage /> },
      { path: '/funcionario/orcamentos',      element: <FuncionarioOrcamentosPage /> },
      { path: '/funcionario/configuracoes',  element: <FuncionarioConfiguracoesPage /> },
    ],
  },

  { path: '*', element: <HomeRedirect /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
