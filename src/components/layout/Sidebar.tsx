import { NavLink, useNavigate } from 'react-router-dom'
import { Car, FileText, Receipt, Wrench, Bell, LogOut, LayoutDashboard, X, Users, HardHat, Settings } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badgeKey?: 'budgets' | 'notifications'
  disabled?: boolean
}

const clientNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Meus veículos', href: '/veiculos', icon: Car },
  { label: 'Orçamentos', href: '/orcamentos', icon: FileText, badgeKey: 'budgets' },
  { label: 'Faturas', href: '/faturas', icon: Receipt, disabled: true },
  { label: 'Serviços', href: '/servicos', icon: Wrench },
  { label: 'Notificações', href: '/notificacoes', icon: Bell, badgeKey: 'notifications', disabled: true },
]

const adminNavItems: NavItem[] = [
  { label: 'Dashboard',    href: '/admin/dashboard',     icon: LayoutDashboard },
  { label: 'Veículos',     href: '/admin/veiculos',      icon: Car             },
  { label: 'Orçamentos',   href: '/admin/orcamentos',    icon: FileText, badgeKey: 'budgets' },
  { label: 'Financeiro',   href: '/admin/financeiro',    icon: Receipt         },
  { label: 'Clientes',     href: '/admin/clientes',      icon: Users           },
  { label: 'Funcionários', href: '/admin/funcionarios',  icon: HardHat         },
  { label: 'Serviços',     href: '/admin/servicos',      icon: Wrench          },
  { label: 'Configurações',href: '/admin/configuracoes', icon: Settings        },
]

const employeeNavItems: NavItem[] = [
  { label: 'Ordens',    href: '/funcionario/ordens',   icon: LayoutDashboard },
  { label: 'Veículos',  href: '/funcionario/veiculos', icon: Car             },
]

function useSidebarBadges() {
  const { data: budgetCount } = useQuery({
    queryKey: ['sidebar', 'pending-budgets'],
    queryFn: async () => {
      const { count } = await supabase
        .from('budgets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'awaiting_approval')
      return count ?? 0
    },
    refetchInterval: 60_000,
  })

  const { data: notifCount } = useQuery({
    queryKey: ['sidebar', 'unread-notifications'],
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
      return count ?? 0
    },
    refetchInterval: 60_000,
  })

  return { budgets: budgetCount ?? 0, notifications: notifCount ?? 0 }
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout, role } = useAuthContext()
  const navigate = useNavigate()
  const badges = useSidebarBadges()

  const navItems =
    role === 'admin'    ? adminNavItems
    : role === 'employee' ? employeeNavItems
    : clientNavItems

  const badgeMap: Record<string, number> = {
    budgets: badges.budgets,
    notifications: badges.notifications,
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-brand-primary transition-transform duration-200 ease-in-out',
          'lg:relative lg:translate-x-0 lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-accent">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">TrackMyFix</span>
            </div>
            <p className="mt-0.5 text-[10px] text-white/50 pl-9 uppercase tracking-widest">
              {role === 'client' ? 'Portal do cliente' : 'Portal da oficina'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white/60 hover:text-white p-1 rounded"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const badge = item.badgeKey ? badgeMap[item.badgeKey] : 0

              if (item.disabled) {
                return (
                  <li key={item.href}>
                    <span className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/30 cursor-not-allowed select-none">
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {badge > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-accent/40 px-1 text-[10px] font-bold text-white/40">
                          {badge}
                        </span>
                      )}
                    </span>
                  </li>
                )
              }

              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                        isActive
                          ? 'bg-white/15 text-white font-semibold'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      )
                    }
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-white">
                        {badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-white/10">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-white/60 hover:bg-white/10 hover:text-white px-3"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>
    </>
  )
}
