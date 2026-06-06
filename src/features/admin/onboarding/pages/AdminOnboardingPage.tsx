import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wrench, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function toSlug(str: string) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  slug: z
    .string()
    .min(2, 'Slug obrigatório')
    .regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
})
type FormData = z.infer<typeof schema>

export function AdminOnboardingPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuthContext()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const watchedName = watch('name', '')
  const watchedSlug = watch('slug', '')

  // Auto-gera slug a partir do nome
  useEffect(() => {
    if (watchedName) {
      setValue('slug', toSlug(watchedName), { shouldValidate: false })
    }
  }, [watchedName, setValue])

  // Verifica disponibilidade do slug (debounced 500ms)
  useEffect(() => {
    if (!watchedSlug || watchedSlug.length < 2) {
      setSlugStatus('idle')
      return
    }
    setSlugStatus('checking')
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('workshops')
        .select('id')
        .eq('slug', watchedSlug)
        .maybeSingle()
      setSlugStatus(data ? 'taken' : 'available')
    }, 500)
    return () => clearTimeout(timer)
  }, [watchedSlug])

  // Se já tem oficina cadastrada, redireciona direto
  useEffect(() => {
    if (!user) return
    supabase
      .from('workshops')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) navigate('/admin/dashboard', { replace: true })
      })
  }, [user, navigate])

  async function onSubmit(data: FormData) {
    setIsSubmitting(true)
    setServerError('')

    const { error } = await supabase.rpc('register_workshop_admin', {
      p_name: data.name,
      p_slug: data.slug,
    })

    if (error) {
      const msg = error.message
      setServerError(
        msg.includes('slug_taken')         ? 'Este endereço já está em uso. Escolha outro.' :
        msg.includes('already_registered') ? 'Você já possui uma oficina cadastrada.' :
        'Erro ao cadastrar. Tente novamente.'
      )
      setIsSubmitting(false)
      return
    }

    await refreshProfile()
    navigate('/admin/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-brand-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent shadow-lg mb-4">
            <Wrench className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Quase lá!</h1>
          <p className="mt-1 text-sm text-white/60">Configure sua oficina para começar</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold text-brand-primary">Dados da oficina</h2>
            <p className="text-sm text-muted-foreground">
              Essas informações poderão ser editadas depois nas configurações.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome da oficina</Label>
                <Input
                  id="name"
                  placeholder="Ex: MecânicaFix"
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug">
                  Endereço de acesso dos clientes
                </Label>
                <div className="flex items-center rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                  <span className="px-2 text-xs text-muted-foreground bg-muted border-r border-input whitespace-nowrap h-9 flex items-center">
                    /acesso/
                  </span>
                  <Input
                    id="slug"
                    placeholder="minha-oficina"
                    {...register('slug')}
                    className="border-0 rounded-none focus-visible:ring-0 shadow-none"
                  />
                  <div className="pr-2 flex-shrink-0">
                    {slugStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {slugStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {slugStatus === 'taken' && <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                </div>
                {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                {slugStatus === 'taken' && !errors.slug && (
                  <p className="text-xs text-destructive">Este endereço já está em uso.</p>
                )}
                {slugStatus === 'available' && (
                  <p className="text-xs text-green-600">Endereço disponível.</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Seus clientes acessarão o portal por este link.
                </p>
              </div>

              {serverError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive">{serverError}</p>
              )}

              <Button
                type="submit"
                variant="accent"
                className="w-full"
                disabled={isSubmitting || slugStatus === 'taken' || slugStatus === 'checking'}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Criando oficina...</>
                ) : (
                  'Criar minha oficina'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
