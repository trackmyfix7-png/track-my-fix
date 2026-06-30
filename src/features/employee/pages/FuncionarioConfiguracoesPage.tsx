import { useState, useEffect } from 'react'
import { CheckCheck, User, Phone, Mail, Briefcase } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { maskPhone } from '@/lib/utils'

export function FuncionarioConfiguracoesPage() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  const [form, setForm]       = useState({ full_name: '', phone: '' })
  const [position, setPosition] = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
      supabase.from('employees').select('position').eq('linked_user_id', user.id).maybeSingle(),
    ]).then(([{ data: profile }, { data: hr }]) => {
      if (profile) setForm({ full_name: profile.full_name ?? '', phone: maskPhone(profile.phone ?? '') })
      setPosition(hr?.position ?? null)
      setLoading(false)
    })
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.full_name.trim()) return
    setSaving(true)
    // RPC atualiza profiles E employees.phone em uma única transação
    await supabase.rpc('update_my_profile', {
      p_full_name: form.full_name.trim(),
      p_phone:     form.phone.trim(),
    })
    await qc.invalidateQueries({ queryKey: ['admin', 'employees'] })
    await qc.invalidateQueries({ queryKey: ['admin', 'employees-hr'] })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Seus dados de perfil"
      />

      <Card className="max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Dados pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="h-10 animate-pulse rounded-md bg-muted" />
              <div className="h-10 animate-pulse rounded-md bg-muted" />
              <div className="h-10 animate-pulse rounded-md bg-muted" />
              <div className="h-10 animate-pulse rounded-md bg-muted" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <User className="h-3 w-3" /> Nome completo <span className="text-brand-accent normal-case font-normal">*</span>
                </label>
                <Input
                  placeholder="Seu nome"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  required
                  className="h-10"
                />
              </div>

              {/* Cargo — somente leitura, definido pelo admin */}
              {position !== null && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Briefcase className="h-3 w-3" /> Cargo
                  </label>
                  <div className="flex h-10 items-center rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground">
                    {position || '—'}
                  </div>
                </div>
              )}

              {/* E-mail — somente leitura, vem da conta Google */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Mail className="h-3 w-3" /> E-mail
                </label>
                <div className="flex h-10 items-center rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground select-all">
                  {user?.email ?? '—'}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Vinculado à conta Google. Não pode ser alterado aqui.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Phone className="h-3 w-3" /> Telefone
                </label>
                <Input
                  placeholder="(11) 99999-0000"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: maskPhone(e.target.value) }))}
                  className="h-10"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  variant={saved ? 'default' : 'accent'}
                  size="sm"
                  disabled={!form.full_name.trim() || saving}
                  className="gap-1.5"
                >
                  {saved ? (
                    <><CheckCheck className="h-3.5 w-3.5" /> Salvo</>
                  ) : saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
