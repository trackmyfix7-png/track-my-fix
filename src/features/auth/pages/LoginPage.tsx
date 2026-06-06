import { Link } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { LoginForm } from '../components/LoginForm'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent shadow-lg mb-4">
            <Wrench className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TrackMyFix</h1>
          <p className="mt-1 text-sm text-white/60">Acesso administrativo</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold text-brand-primary">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground">Entre com sua conta Google para continuar.</p>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-sm text-white/50">
          Ainda não tem uma oficina?{' '}
          <Link to="/registro-oficina" className="text-white/80 hover:text-white underline underline-offset-2">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
