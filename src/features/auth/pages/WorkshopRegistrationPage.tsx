import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wrench, Loader2, ClipboardList, Bell, Users, Eye, EyeOff, MailCheck } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const schema = z.object({
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

const benefits = [
  { icon: ClipboardList, text: 'Gerencie ordens de serviço em tempo real' },
  { icon: Bell,          text: 'Clientes acompanham o status pelo celular' },
  { icon: Users,         text: 'Portal de acesso personalizado para cada cliente' },
]

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export function WorkshopRegistrationPage() {
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  // useRef é síncrono — não depende do ciclo de re-render para bloquear o redirect
  const isRegisteringRef = useRef(false)
  const { loginWithGoogle, signUp, isAuthenticated, role } = useAuthContext()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (isAuthenticated && !isRegisteringRef.current) {
      navigate(role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true })
    }
  }, [isAuthenticated, role, navigate])

  async function handleGoogle() {
    setGoogleLoading(true)
    setServerError('')
    try {
      sessionStorage.setItem('pendingAdminRegistration', 'true')
      await loginWithGoogle()
    } catch {
      sessionStorage.removeItem('pendingAdminRegistration')
      setServerError('Não foi possível iniciar o cadastro. Tente novamente.')
      setGoogleLoading(false)
    }
  }

  async function onSubmit(data: FormData) {
    isRegisteringRef.current = true
    setServerError('')
    try {
      const result = await signUp(data.email, data.password)
      if (result.needsEmailConfirmation) {
        setEmailSent(true)
      } else {
        navigate('/admin/onboarding', { replace: true })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setServerError(
        msg.toLowerCase().includes('already')
          ? 'Este e-mail já está cadastrado. Tente entrar.'
          : 'Erro ao criar conta. Tente novamente.'
      )
      isRegisteringRef.current = false
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-brand-primary flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent shadow-lg mb-4 mx-auto">
            <MailCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Verifique seu e-mail</h1>
          <p className="mt-3 text-sm text-white/70 leading-relaxed">
            Enviamos um link de confirmação para seu e-mail. Clique no link para ativar sua conta e continuar o cadastro.
          </p>
          <p className="mt-4 text-xs text-white/40">
            Após confirmar, volte aqui e acesse{' '}
            <Link to="/login" className="text-white/70 hover:text-white underline underline-offset-2">
              /login
            </Link>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent shadow-lg mb-4">
            <Wrench className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TrackMyFix</h1>
          <p className="mt-1 text-sm text-white/60">Para donos de oficina</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-3">
            <h2 className="text-lg font-semibold text-brand-primary">Cadastre sua oficina</h2>
            <p className="text-sm text-muted-foreground">Crie sua conta e comece a gerenciar seus clientes.</p>
          </CardHeader>

          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-brand-primary/10">
                    <Icon className="h-3.5 w-3.5 text-brand-primary" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>

            {serverError && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive">{serverError}</p>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full gap-3 h-11 font-medium"
              onClick={handleGoogle}
              disabled={googleLoading || isSubmitting}
            >
              {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
              {googleLoading ? 'Redirecionando...' : 'Cadastrar com Google'}
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">E-mail</Label>
                <Input id="reg-email" type="email" placeholder="seu@email.com" autoComplete="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Senha</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting || googleLoading}>
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando conta...</> : 'Criar conta'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-sm text-white/50">
          Já tem uma oficina?{' '}
          <Link to="/login" className="text-white/80 hover:text-white underline underline-offset-2">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
