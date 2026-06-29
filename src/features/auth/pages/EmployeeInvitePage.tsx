import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { HardHat, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Workshop } from '@/types/database'

type PageState = 'loading' | 'ready' | 'not_found' | 'signing_in'

export function EmployeeInvitePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, role, loginWithGoogle } = useAuthContext()
  const [state, setState] = useState<PageState>('loading')
  const [workshop, setWorkshop] = useState<Workshop | null>(null)

  // Se já é funcionário, vai direto pro portal
  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'employee') {
        navigate('/funcionario/ordens', { replace: true })
      } else if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      }
      // role === 'client': não redireciona — deixa re-autenticar para aceitar convite
    }
  }, [isAuthenticated, role, navigate])

  useEffect(() => {
    if (!slug) {
      setState('not_found')
      return
    }

    supabase
      .from('workshops')
      .select('id, name, slug, owner_id, created_at, address, phone, cnpj')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setState('not_found')
        } else {
          setWorkshop(data)
          sessionStorage.setItem('pendingEmployeeSlug', slug)
          setState('ready')
        }
      })
  }, [slug])

  async function handleGoogleLogin() {
    setState('signing_in')
    try {
      await loginWithGoogle()
    } catch {
      setState('ready')
    }
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-brand-primary flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    )
  }

  if (state === 'not_found') {
    return (
      <div className="min-h-screen bg-brand-primary flex items-center justify-center p-4">
        <div className="text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent shadow-lg mb-4 mx-auto">
            <HardHat className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TrackMyFix</h1>
          <p className="mt-4 text-white/70">Link de convite inválido ou expirado.</p>
          <p className="mt-1 text-sm text-white/40">Entre em contato com a oficina para obter um novo link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent shadow-lg mb-4">
            <HardHat className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TrackMyFix</h1>
          <p className="mt-1 text-sm text-white/60">Portal do Funcionário</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Convite de</p>
            <h2 className="text-xl font-bold text-brand-primary leading-tight">{workshop?.name}</h2>
            <p className="text-sm text-muted-foreground">
              Entre com sua conta Google para acessar o portal do funcionário desta oficina.
            </p>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full gap-3 h-11 font-medium"
              onClick={handleGoogleLogin}
              disabled={state === 'signing_in'}
            >
              {state === 'signing_in' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {state === 'signing_in' ? 'Redirecionando...' : 'Continuar com Google'}
            </Button>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-white/40">
          Problemas para acessar? Entre em contato com a oficina.
        </p>
      </div>
    </div>
  )
}
