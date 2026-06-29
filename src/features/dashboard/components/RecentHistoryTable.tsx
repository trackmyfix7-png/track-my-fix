import type { ServiceOrder } from '@/types/database'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ServiceOrderStatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'

interface RecentHistoryTableProps {
  orders: ServiceOrder[]
}

export function RecentHistoryTable({ orders }: RecentHistoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Veículo</TableHead>
          <TableHead>Entrada</TableHead>
          <TableHead>Saída</TableHead>
          <TableHead>Serviço</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">
              {order.vehicle
                ? `${order.vehicle.brand} ${order.vehicle.model}`
                : '—'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(order.entry_date)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {order.exit_date ? formatDate(order.exit_date) : '—'}
            </TableCell>
            <TableCell className="text-muted-foreground max-w-[180px] truncate">
              {order.problem_description ?? '—'}
            </TableCell>
            <TableCell>
              <ServiceOrderStatusBadge status={order.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
