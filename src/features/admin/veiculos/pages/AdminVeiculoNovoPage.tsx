import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, getInitials } from '@/lib/utils'

// ─── Checklist items ──────────────────────────────────────────────────────────

const checklistItems = [
  { id: 'lataria',   label: 'Lataria sem amassados'   },
  { id: 'vidros',    label: 'Vidros íntegros'          },
  { id: 'farois',    label: 'Faróis e lanternas OK'    },
  { id: 'pneus',     label: 'Pneus sem danos'          },
  { id: 'interior',  label: 'Interior sem avarias'     },
  { id: 'km',        label: 'Km registrado e conferido'},
]

// ─── Mock clients (para busca) ─────────────────────────────────────────────────

const mockClients = [
  { id: '1', name: 'Carlos Ribeiro',  email: 'carlos@email.com'  },
  { id: '2', name: 'Ana Paula',       email: 'ana@email.com'     },
  { id: '3', name: 'Maria Silva',     email: 'maria@email.com'   },
  { id: '4', name: 'Roberto Mendes',  email: 'roberto@email.com' },
  { id: '5', name: 'Felipe Lima',     email: 'felipe@email.com'  },
  { id: '6', name: 'Pedro Lima',      email: 'pedro@email.com'   },
  { id: '7', name: 'João Ferreira',   email: 'joao@email.com'    },
]

const fuelOptions = ['Flex', 'Gasolina', 'Etanol', 'Diesel', 'GNV', 'Elétrico', 'Híbrido']

// ─── Checklist item ────────────────────────────────────────────────────────────

function CheckItem({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (id: string, v: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors"
    >
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(id, !checked)}
        className={cn(
          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors',
          checked
            ? 'border-brand-secondary bg-brand-secondary'
            : 'border-border bg-white'
        )}
      >
        {checked && <Check className="h-3 w-3 text-white stroke-[3]" />}
      </button>
      <span className="text-sm text-foreground">{label}</span>
    </label>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminVeiculoNovoPage() {
  const navigate = useNavigate()

  // Form state
  const [plate,       setPlate]       = useState('')
  const [km,          setKm]          = useState('')
  const [brand,       setBrand]       = useState('')
  const [model,       setModel]       = useState('')
  const [year,        setYear]        = useState('')
  const [color,       setColor]       = useState('')
  const [fuel,        setFuel]        = useState('')
  const [problem,     setProblem]     = useState('')
  const [observations,setObservations] = useState('')

  // Checklist state
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  // Client search
  const [clientSearch,   setClientSearch]   = useState('')
  const [selectedClient, setSelectedClient] = useState<typeof mockClients[number] | null>(null)

  const clientResults =
    clientSearch.length >= 2
      ? mockClients.filter(
          (c) =>
            c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.email.toLowerCase().includes(clientSearch.toLowerCase())
        )
      : []

  function toggleCheck(id: string, value: boolean) {
    setChecked((prev) => ({ ...prev, [id]: value }))
  }

  function handleSelectClient(client: typeof mockClients[number]) {
    setSelectedClient(client)
    setClientSearch('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Backend integration comes next
    navigate('/admin/veiculos')
  }

  const checkedCount = Object.values(checked).filter(Boolean).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadastrar novo veículo"
        description="Dados de entrada do veículo na oficina"
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/veiculos')}>
            Cancelar
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* ── Dados do veículo (3/5) ─────────────────────────────── */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dados do veículo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Placa + KM */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Placa</Label>
                  <Input
                    placeholder="ABC-1234"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    className="font-mono uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Km atual</Label>
                  <Input
                    type="number"
                    placeholder="72.400"
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                  />
                </div>
              </div>

              {/* Marca + Modelo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Marca</Label>
                  <Input
                    placeholder="Honda"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Modelo</Label>
                  <Input
                    placeholder="Civic"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
              </div>

              {/* Ano + Cor + Combustível */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Ano</Label>
                  <Input
                    type="number"
                    placeholder="2021"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cor</Label>
                  <Input
                    placeholder="Prata"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Combustível</Label>
                  <Select value={fuel} onValueChange={setFuel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelOptions.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Problema */}
              <div className="space-y-1.5">
                <Label>Problema relatado pelo cliente</Label>
                <Textarea
                  placeholder="Descreva o problema relatado pelo cliente..."
                  rows={3}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Check-list de entrada (2/5) ──────────────────────────── */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-brand-secondary" />
                  Check-list de entrada
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {checkedCount}/{checklistItems.length} verificados
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Marque os itens verificados</p>
            </CardHeader>
            <CardContent className="space-y-1 pt-2">
              {checklistItems.map((item) => (
                <CheckItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  checked={checked[item.id] ?? false}
                  onChange={toggleCheck}
                />
              ))}

              <div className="pt-3 space-y-1.5">
                <Label>Observações gerais</Label>
                <Textarea
                  placeholder="Anotações sobre o estado do veículo na entrada..."
                  rows={3}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Cliente vinculado ───────────────────────────────────────── */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cliente vinculado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm space-y-2 relative">
              <Input
                placeholder="Buscar cliente por nome ou e-mail"
                value={selectedClient ? selectedClient.name : clientSearch}
                onChange={(e) => {
                  setSelectedClient(null)
                  setClientSearch(e.target.value)
                }}
              />

              {/* Search results dropdown */}
              {clientResults.length > 0 && !selectedClient && (
                <div className="absolute top-full left-0 z-10 w-full rounded-md border border-border bg-white shadow-md">
                  {clientResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectClient(c)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs">
                          {getInitials(c.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected client chip */}
              {selectedClient && (
                <div className="flex items-center gap-3 rounded-lg border border-brand-secondary/30 bg-brand-secondary/5 px-3 py-2">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-brand-secondary/20 text-brand-secondary text-xs font-semibold">
                      {getInitials(selectedClient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{selectedClient.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedClient.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedClient(null)}
                    className="text-muted-foreground hover:text-foreground text-xs"
                  >
                    Trocar
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Actions ────────────────────────────────────────────────── */}
        <div className="mt-6 flex items-center gap-3">
          <Button type="submit" variant="accent" disabled={!plate || !brand || !model}>
            Cadastrar veículo
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/veiculos')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
