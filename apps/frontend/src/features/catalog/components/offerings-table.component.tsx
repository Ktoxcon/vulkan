import { useTranslation } from "react-i18next"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OfferingStatusBadge } from "@/features/catalog/components/offering-status-badge.component"
import { OfferingRowActions } from "@/features/catalog/components/offering-row-actions.component"
import { formatOfferingType } from "@/features/catalog/formatters/offering-type.formatter"
import type { Offering } from "@/features/catalog/types/offering.types"
import { formatPrice } from "@/lib/formatters/price.formatter"
import { formatDate } from "@/lib/formatters/date.formatter"
import { SHORT_DATE } from "@/lib/formatters/date.formatter.constants"

type OfferingsTableProps = {
  offerings: Offering[]
}

export function OfferingsTable({ offerings }: OfferingsTableProps) {
  const { t } = useTranslation("catalog")
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.name")}</TableHead>
            <TableHead>{t("table.type")}</TableHead>
            <TableHead className="text-right">{t("table.basePrice")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("table.created")}</TableHead>
            <TableHead className="text-right">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offerings.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-muted-foreground"
              >
                {t("table.empty")}
              </TableCell>
            </TableRow>
          ) : (
            offerings.map((offering) => (
              <TableRow key={offering.id}>
                <TableCell className="font-medium">{offering.name}</TableCell>
                <TableCell>{formatOfferingType(offering.type)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPrice(offering.basePrice)}
                </TableCell>
                <TableCell>
                  <OfferingStatusBadge isActive={offering.isActive} />
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {formatDate(offering.createdAt, SHORT_DATE)}
                </TableCell>
                <TableCell>
                  <OfferingRowActions offering={offering} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
