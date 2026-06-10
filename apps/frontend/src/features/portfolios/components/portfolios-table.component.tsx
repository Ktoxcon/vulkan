import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PortfolioStatusBadge } from "@/features/portfolios/components/portfolio-status-badge.component"
import type { PortfolioListRow } from "@/features/portfolios/types/portfolio.types"
import { Routes } from "@/lib/constants/routes.constants"
import { formatPrice } from "@/lib/formatters/price.formatter"
import { formatDate } from "@/lib/formatters/date.formatter"
import { SHORT_DATE } from "@/lib/formatters/date.formatter.constants"

type PortfoliosTableProps = {
  portfolios: PortfolioListRow[]
}

export function PortfoliosTable({ portfolios }: PortfoliosTableProps) {
  const { t } = useTranslation("portfolios")

  if (portfolios.length === 0) {
    return (
      <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">
        {t("table.empty")}
      </p>
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {portfolios.map((portfolio) => (
          <li key={portfolio.id}>
            <Link
              to={Routes.portfolioDetail.replace(":portfolioId", portfolio.id)}
              className="flex flex-col gap-2 rounded-md border border-border p-4 transition-colors hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-medium">{portfolio.clientName}</span>
                  <span className="text-xs text-muted-foreground">
                    {portfolio.clientEmail}
                  </span>
                </div>
                <PortfolioStatusBadge status={portfolio.status} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("table.card.attends", { date: formatDate(portfolio.attendanceDate, SHORT_DATE) })}</span>
                <span className="font-medium text-foreground">
                  {formatPrice(portfolio.totalAfterDiscount)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.columns.client")}</TableHead>
              <TableHead>{t("table.columns.email")}</TableHead>
              <TableHead>{t("table.columns.attendance")}</TableHead>
              <TableHead>{t("table.columns.status")}</TableHead>
              <TableHead className="text-right">{t("table.columns.before")}</TableHead>
              <TableHead className="text-right">{t("table.columns.discount")}</TableHead>
              <TableHead className="text-right">{t("table.columns.after")}</TableHead>
              <TableHead>{t("table.columns.created")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {portfolios.map((portfolio) => (
              <TableRow key={portfolio.id}>
                <TableCell className="font-medium">
                  <Link
                    to={Routes.portfolioDetail.replace(
                      ":portfolioId",
                      portfolio.id,
                    )}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {portfolio.clientName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {portfolio.clientEmail}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(portfolio.attendanceDate, SHORT_DATE)}
                </TableCell>
                <TableCell>
                  <PortfolioStatusBadge status={portfolio.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPrice(portfolio.totalBeforeDiscount)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPrice(portfolio.totalDiscountAmount)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatPrice(portfolio.totalAfterDiscount)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(portfolio.createdAt, SHORT_DATE)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
