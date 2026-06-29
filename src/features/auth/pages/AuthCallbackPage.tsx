import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { user, isLoading, role } = useAuthContext()
  const handled = useRef(false)

  // Troca o code pelo session (PKCE flow do Supabase)
  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(window.location.search)

    // Supabase retorna o token no hash (#access_token=...) ou no search (?code=...)
    if (hash.includes('access_token') || params.get('code')) {
      supabase.auth.getSession() // força o Supabase a processar o callback
    }
  }, [])

  // Quando AuthContext resolver o user (via onAuthStateChange SIGNED_IN), redireciona
  useEffect(() => {
    if (handled.current || isLoading) return

    if (user) {
      handled.current = true

      // Fluxo de cadastro de nova oficina
      const pendingRegistration = sessionStorage.getItem('pendingAdminRegistration')
      if (pendingRegistration === 'true') {
        sessionStorage.removeItem('pendingAdminRegistration')
        navigate('/admin/onboarding', { replace: true })
        return
      }

      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
        return
      }

      if (role === 'employee') {
        navigate('/funcionario/ordens', { replace: true })
        return
      }

      // Convite de funcionário via link
      const pendingEmployeeSlug = sessionStorage.getItem('pendingEmployeeSlug')
      if (pendingEmployeeSlug) {
        sessionStorage.removeItem('pendingEmployeeSlug')
        supabase
          .rpc('join_as_employee', { p_workshop_slug: pendingEmployeeSlug })
          .then(() => {
            // Hard navigation para recarregar o contexto com role=employee
            window.location.replace('/funcionario/ordens')
          })
        return
      }

      // Convite de cliente via link
      const pendingSlug = sessionStorage.getItem('pendingWorkshopSlug')
      if (pendingSlug) {
        sessionStorage.removeItem('pendingWorkshopSlug')
        supabase
          .from('workshops')
          .select('id')
          .eq('slug', pendingSlug)
          .single()
          .then(({ data: workshop }) => {
            if (!workshop) {
              navigate('/sem-acesso', { replace: true })
              return
            }
            supabase
              .from('client_workshops')
              .upsert({ client_id: user.id, workshop_id: workshop.id }, { onConflict: 'client_id,workshop_id' })
              .then(() => {
                // Tenta vincular pré-cadastro pelo e-mail (ignora erro se não existir)
                supabase.rpc('link_pre_registered_client', { p_workshop_slug: pendingSlug }).then()
                navigate('/dashboard', { replace: true })
              })
          })
        return
      }

      // Usuário existente sem convite pendente — verifica vínculo
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

  return (
    <div className="min-h-screen bg-brand-primary flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      <p className="text-sm text-white/50">Verificando acesso...</p>
    </div>
  )
}
