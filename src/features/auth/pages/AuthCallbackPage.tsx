import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { user, isLoading, role } = useAuthContext()
  const handled = useRef(false)
  const [hasError, setHasError] = useState(false)

  // Garante que o Supabase processa o código PKCE / token no hash
  useEffect(() => {
    const hash   = window.location.hash
    const params = new URLSearchParams(window.location.search)
    if (hash.includes('access_token') || params.get('code')) {
      supabase.auth.getSession()
    }
  }, [])

  // Timeout de segurança: se travar por mais de 15s, exibe erro
  useEffect(() => {
    const t = setTimeout(() => {
      if (!handled.current) setHasError(true)
    }, 15_000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (handled.current || isLoading) return

    if (user) {
      handled.current = true

      // 1. Cadastro de nova oficina
      const pendingRegistration = sessionStorage.getItem('pendingAdminRegistration')
      if (pendingRegistration === 'true') {
        sessionStorage.removeItem('pendingAdminRegistration')
        navigate('/admin/onboarding', { replace: true })
        return
      }

      // 2. Já é admin
      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
        return
      }

      // 3. Já é funcionário
      if (role === 'employee') {
        navigate('/funcionario/dashboard', { replace: true })
        return
      }

      // 4. Convite de funcionário via link
      const pendingEmployeeSlug = sessionStorage.getItem('pendingEmployeeSlug')
      if (pendingEmployeeSlug) {
        sessionStorage.removeItem('pendingEmployeeSlug')
        supabase
          .rpc('join_as_employee', { p_workshop_slug: pendingEmployeeSlug })
          .then(({ error }) => {
            if (error) {
              console.error('join_as_employee failed:', error)
              setHasError(true)
            } else {
              // Hard navigation para recarregar AuthContext com role=employee
              window.location.replace('/funcionario/dashboard')
            }
          })
        return
      }

      // 5. Convite de cliente via link
      const pendingSlug = sessionStorage.getItem('pendingWorkshopSlug')
      if (pendingSlug) {
        sessionStorage.removeItem('pendingWorkshopSlug')
        supabase
          .from('workshops')
          .select('id')
          .eq('slug', pendingSlug)
          .single()
          .then(({ data: workshop, error }) => {
            if (error || !workshop) {
              navigate('/sem-acesso', { replace: true })
              return
            }
            supabase
              .from('client_workshops')
              .upsert(
                { client_id: user.id, workshop_id: workshop.id },
                { onConflict: 'client_id,workshop_id' }
              )
              .then(() => {
                // Tenta vincular pré-cadastro por e-mail (ignora erro se não existir)
                supabase.rpc('link_pre_registered_client', { p_workshop_slug: pendingSlug }).then()
                navigate('/dashboard', { replace: true })
              })
          })
        return
      }

      // 6. Usuário existente sem convite pendente — verifica vínculo
      supabase
        .from('client_workshops')
        .select('id')
        .eq('client_id', user.id)
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            navigate('/dashboard', { replace: true })
          } else {
            navigate('/sem-acesso', { replace: true })
          }
        })
    } else if (!isLoading) {
      navigate('/login', { replace: true })
    }
  }, [user, isLoading, role, navigate])

  if (hasError) {
    return (
      <div className="min-h-screen bg-brand-primary flex flex-col items-center justify-center gap-6 p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent/20">
          <AlertTriangle className="h-7 w-7 text-brand-accent" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-white">Algo deu errado</h2>
          <p className="mt-1 text-sm text-white/60">
            Não foi possível completar o acesso. O link pode ser inválido ou expirado.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/login">Ir para login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-primary flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      <p className="text-sm text-white/50">Verificando acesso...</p>
    </div>
  )
}
