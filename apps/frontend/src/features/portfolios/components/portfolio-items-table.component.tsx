import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PortfolioItem } from "@/features/portfolios/types/portfolio.types"
import { formatPrice } from "@/lib/formatters/price.formatter"

type PortfolioItemsTableProps = {
  items: PortfolioItem[]
}

export function PortfolioItemsTable({ items }: PortfolioItemsTableProps) {
  const { t } = useTranslation("portfolios")

  if (items.length === 0) {
    return (
      <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">
        {t("itemsTable.empty")}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("itemsTable.columns.offering")}</TableHead>
            <TableHead>{t("itemsTable.columns.type")}</TableHead>
            <TableHead className="text-right">{t("itemsTable.columns.basePrice")}</TableHead>
            <TableHead className="text-right">{t("itemsTable.columns.discount")}</TableHead>
            <TableHead className="text-right">{t("itemsTable.columns.discountAmount")}</TableHead>
            <TableHead className="text-right">{t("itemsTable.columns.finalPrice")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.offeringName}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {t(`offeringType.${item.offeringType}`)}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPrice(item.basePrice)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {item.discountPercentage}%
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPrice(item.discountAmount)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatPrice(item.finalPrice)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
