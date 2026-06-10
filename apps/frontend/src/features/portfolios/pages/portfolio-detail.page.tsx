import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PortfolioStatusBadge } from "@/features/portfolios/components/portfolio-status-badge.component"
import { PortfolioItemsTable } from "@/features/portfolios/components/portfolio-items-table.component"
import { PortfolioTotals } from "@/features/portfolios/components/portfolio-totals.component"
import { PortfolioStatusActions } from "@/features/portfolios/components/portfolio-status-actions.component"
import { usePortfolio } from "@/features/portfolios/hooks/portfolio.hook"
import { useExportPortfolio } from "@/features/portfolios/hooks/portfolio-export.hook"
import { Routes } from "@/lib/constants/routes.constants"
import { ApiError } from "@/lib/errors/api.error"
import { formatDate } from "@/lib/formatters/date.formatter"
import { SHORT_DATE } from "@/lib/formatters/date.formatter.constants"

export function PortfolioDetailPage() {
  const { t } = useTranslation("portfolios")
  const { portfolioId } = useParams<{ portfolioId: string }>()
  const { portfolio, isLoading, isError, error } = usePortfolio(portfolioId)
  const exportPortfolio = useExportPortfolio(portfolioId ?? "")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" aria-label={t("detail.loading")} />
      </div>
    )
  }

  if (isError || !portfolio) {
    const isForbidden =
      error instanceof ApiError && error.code === "PORTFOLIO_ACCESS_DENIED"
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-sm font-medium text-destructive">
          {isForbidden
            ? t("detail.error.forbidden")
            : t("detail.error.notFound")}
        </p>
        <Button asChild variant="outline" className="h-11 md:h-9">
          <Link to={Routes.events}>{t("detail.error.backToEvents")}</Link>
        </Button>
      </div>
    )
  }

  const eventPath = Routes.eventDetail.replace(":eventId", portfolio.event.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Button asChild variant="ghost" size="sm" className="h-11 w-fit px-2 md:h-9">
          <Link to={eventPath}>
            <ArrowLeft />
            {t("detail.backToEvent")}
          </Link>
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-primary">
              {portfolio.client.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {portfolio.client.email}
            </p>
          </div>
          <PortfolioStatusBadge status={portfolio.status} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.overview.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">{t("detail.overview.event")}</p>
            <p className="text-sm font-medium">{portfolio.event.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("detail.overview.attendanceDate")}</p>
            <p className="text-sm font-medium">
              {formatDate(portfolio.attendanceDate, SHORT_DATE)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>{t("detail.lifecycle.title")}</CardTitle>
          <Button
            variant="outline"
            className="h-11 w-full sm:w-auto md:h-9"
            onClick={() => exportPortfolio.mutate()}
            disabled={exportPortfolio.isPending}
          >
            {exportPortfolio.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download />
            )}
            {t("detail.lifecycle.exportCsv")}
          </Button>
        </CardHeader>
        <CardContent>
          <PortfolioStatusActions portfolio={portfolio} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.items.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PortfolioItemsTable items={portfolio.items} />
        </CardContent>
      </Card>

      <PortfolioTotals portfolio={portfolio} />
    </div>
  )
}
