import type { ServiceOrder } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const DELIVERED_BADGE = 'bg-teal-100 text-teal-700'

interface RecentHistoryTableProps {
  orders: ServiceOrder[]
}

export function RecentHistoryTable({ orders }: RecentHistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {['Veículo', 'Entrada', 'Saída', 'Serviço', 'Status'].map((h) => (
              <th
                key={h}
                className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const v       = order.vehicle
            const service = order.service_description || order.problem_description

            return (
              <tr
                key={order.id}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-foreground">
                    {v ? `${v.brand} ${v.model}` : '—'}
                  </p>
                  {v?.year && (
                    <p className="text-xs text-muted-foreground">{v.year}</p>
                  )}
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(order.entry_date)}
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground whitespace-nowrap">
                  {order.exit_date ? formatDate(order.exit_date) : '—'}
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                  {service ?? '—'}
                </td>
                <td className="px-5 py-3">
                  <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', DELIVERED_BADGE)}>
                    Entregue
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
