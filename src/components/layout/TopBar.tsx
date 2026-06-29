import { Menu, Bell, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthContext } from '@/contexts/AuthContext'
import { getInitials } from '@/lib/utils'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, role } = useAuthContext()

  const { data: unreadCount = 0 } = useQuery({
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

  const roleLabel = role === 'admin' ? 'Administrador' : role === 'employee' ? 'Funcionário' : 'Cliente'
  const settingsHref = role === 'admin' ? '/admin/configuracoes' : '#'

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        {/* Sino */}
        <div className="relative">
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>

        {/* Configurações */}
        <Button variant="ghost" size="icon" asChild>
          <Link to={settingsHref}>
            <Settings className="h-4 w-4" />
          </Link>
        </Button>

        {/* Separador */}
        <div className="mx-1 h-6 w-px bg-border" />

        {/* Usuário */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {user?.profile.full_name ?? roleLabel}
            </p>
            <p className="text-xs text-muted-foreground leading-tight">{roleLabel}</p>
          </div>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-brand-secondary text-white text-xs font-semibold">
              {user ? getInitials(user.profile.full_name) : '?'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
