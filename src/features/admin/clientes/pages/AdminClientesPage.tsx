import { useState } from 'react'
import { Search, Car, Receipt } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency, getInitials } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminClient {
  id: string
  name: string
  email: string
  vehicles: number
  visits: number
  totalSpent: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockClients: AdminClient[] = [
  { id: '1', name: 'Carlos Ribeiro', email: 'carlos@email.com',  vehicles: 2, visits: 3, totalSpent: 7480 },
  { id: '2', name: 'Ana Paula',      email: 'ana@email.com',     vehicles: 5, visits: 1, totalSpent: 590  },
  { id: '3', name: 'Maria Silva',    email: 'maria@email.com',   vehicles: 1, visits: 5, totalSpent: 4100 },
  { id: '4', name: 'Roberto Mendes', email: 'roberto@email.com', vehicles: 1, visits: 2, totalSpent: 1200 },
  { id: '5', name: 'Felipe Lima',    email: 'felipe@email.com',  vehicles: 1, visits: 1, totalSpent: 310  },
]

// ─── Row ──────────────────────────────────────────────────────────────────────

function ClientRow({ client }: { client: AdminClient }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
      {/* Cliente */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs font-semibold">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">{client.name}</span>
        </div>
      </td>

      {/* E-mail */}
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">{client.email}</span>
      </td>

      {/* Veículos */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Car className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{client.vehicles}</span>
        </div>
      </td>

      {/* Visitas */}
      <td className="px-4 py-3 text-center">
        <span className="text-sm font-medium text-foreground">{client.visits}</span>
      </td>

      {/* Total gasto */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold text-brand-primary">
            {formatCurrency(client.totalSpent)}
          </span>
        </div>
      </td>
    </tr>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminClientesPage() {
  const [search, setSearch] = useState('')

  const filtered = mockClients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = mockClients.reduce((s, c) => s + c.totalSpent, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de clientes"
        description={`${mockClients.length} clientes cadastrados`}
      />

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5">
          <span className="text-xs text-muted-foreground">Total clientes</span>
          <span className="text-sm font-bold text-brand-primary">{mockClients.length}</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5">
          <span className="text-xs text-muted-foreground">Total gasto</span>
          <span className="text-sm font-bold text-brand-secondary">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5">
          <span className="text-xs text-muted-foreground">Ticket médio</span>
          <span className="text-sm font-bold text-brand-primary">
            {formatCurrency(totalRevenue / mockClients.length)}
          </span>
        </div>
      </div>

      {/* Search + table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base flex-1">Clientes</CardTitle>
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                className="pl-8 h-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cliente
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    E-mail
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Veículos
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Visitas
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Total gasto
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((client) => <ClientRow key={client.id} client={client} />)
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
