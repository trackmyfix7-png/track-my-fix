import { Wrench, LinkIcon, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export function AuthErrorPage() {
  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-brand-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent shadow-lg mb-4 mx-auto">
          <Wrench className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">TrackMyFix</h1>

        <div className="mt-8 rounded-xl bg-white/10 p-6 text-left">
          <div className="flex items-start gap-3">
            <LinkIcon className="h-5 w-5 text-brand-accent flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-semibold text-white">Acesso não encontrado</h2>
              <p className="mt-1 text-sm text-white/70 leading-relaxed">
                Sua conta não está vinculada a nenhuma oficina. Para acessar o portal, utilize o link enviado pela oficina.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-white/40">
          Se você recebeu um link, acesse-o diretamente no navegador.
        </p>

        <Button
          variant="ghost"
          size="sm"
          className="mt-6 text-white/50 hover:text-white hover:bg-white/10 gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair da conta Google
        </Button>
      </div>
    </div>
  )
}
