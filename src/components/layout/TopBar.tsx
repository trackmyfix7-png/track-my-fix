import { Menu, Bell, Settings } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
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

      <div className="flex items-center gap-1">
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
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
