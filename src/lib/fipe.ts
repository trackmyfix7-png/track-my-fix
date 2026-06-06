import { useQuery } from '@tanstack/react-query'
import type { ComboboxOption } from '@/components/ui/combobox'

const BASE = 'https://parallelum.com.br/fipe/api/v1/carros'

interface FipeBrand  { codigo: string; nome: string }
interface FipeModels { modelos: { codigo: number; nome: string }[] }
interface FipeYear   { codigo: string; nome: string }

async function fetchBrands(): Promise<FipeBrand[]> {
  const res = await fetch(`${BASE}/marcas`)
  if (!res.ok) throw new Error('Erro ao buscar marcas')
  return res.json()
}

async function fetchModels(brandCode: string): Promise<FipeModels['modelos']> {
  const res = await fetch(`${BASE}/marcas/${brandCode}/modelos`)
  if (!res.ok) throw new Error('Erro ao buscar modelos')
  const data: FipeModels = await res.json()
  return data.modelos
}

async function fetchYears(brandCode: string, modelCode: string): Promise<FipeYear[]> {
  const res = await fetch(`${BASE}/marcas/${brandCode}/modelos/${modelCode}/anos`)
  if (!res.ok) throw new Error('Erro ao buscar anos')
  return res.json()
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useFipeBrands() {
  return useQuery({
    queryKey: ['fipe', 'brands'],
    queryFn: fetchBrands,
    staleTime: Infinity, // brands never change
    select: (data): ComboboxOption[] =>
      data.map((b) => ({ value: b.codigo, label: b.nome })),
  })
}

export function useFipeModels(brandCode: string) {
  return useQuery({
    queryKey: ['fipe', 'models', brandCode],
    queryFn: () => fetchModels(brandCode),
    enabled: !!brandCode,
    staleTime: Infinity,
    select: (data): ComboboxOption[] =>
      data.map((m) => ({ value: String(m.codigo), label: m.nome })),
  })
}

export function useFipeYears(brandCode: string, modelCode: string) {
  return useQuery({
    queryKey: ['fipe', 'years', brandCode, modelCode],
    queryFn: () => fetchYears(brandCode, modelCode),
    enabled: !!brandCode && !!modelCode,
    staleTime: Infinity,
    select: (data): ComboboxOption[] => {
      // FIPE year codes: "2021-1" → only unique years, strip fuel type
      const seen = new Set<string>()
      return data
        .map((y) => {
          const year = y.codigo.split('-')[0]
          return { value: year, label: year }
        })
        .filter((y) => {
          if (seen.has(y.value) || y.value === '32000') return false
          seen.add(y.value)
          return true
        })
        .sort((a, b) => Number(b.value) - Number(a.value))
    },
  })
}
