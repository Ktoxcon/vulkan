import { useTranslation } from "react-i18next"
import { Loader2 } from "lucide-react"
import { PortfoliosTable } from "@/features/portfolios/components/portfolios-table.component"
import { useEventPortfolios } from "@/features/portfolios/hooks/event-portfolios.hook"

type EventPortfoliosPanelProps = { eventId: string }

export function EventPortfoliosPanel({ eventId }: EventPortfoliosPanelProps) {
  const { t } = useTranslation("events")
  const { portfolios, isLoading, isError } = useEventPortfolios(eventId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" aria-label={t("loading")} />
      </div>
    )
  }

  if (isError) {
    return (
      <p role="alert" className="text-sm font-medium text-destructive">
        {t("portfolios.loadError")}
      </p>
    )
  }

  return <PortfoliosTable portfolios={portfolios} />
}
