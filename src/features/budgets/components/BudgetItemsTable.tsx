import type { BudgetItem } from '@/types/database'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

interface BudgetItemsTableProps {
  items: BudgetItem[]
  total: number
}

export function BudgetItemsTable({ items, total }: BudgetItemsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrição</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead className="text-right">Qtd.</TableHead>
          <TableHead className="text-right">Valor unit.</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.description}</TableCell>
            <TableCell>
              <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground font-medium">
                {item.category}
              </span>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">{item.quantity}</TableCell>
            <TableCell className="text-right text-muted-foreground">
              {formatCurrency(item.unit_price)}
            </TableCell>
            <TableCell className="text-right font-medium">{formatCurrency(item.total_price)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={4} className="font-semibold text-brand-primary">
            Total
          </TableCell>
          <TableCell className="text-right font-bold text-brand-accent text-base">
            {formatCurrency(total)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
