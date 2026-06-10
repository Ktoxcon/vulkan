import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { statusBadgeVariant } from "@/features/portfolios/constants/portfolio.constants"
import type { PortfolioStatus } from "@/features/portfolios/types/portfolio.types"

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "link"

type PortfolioStatusBadgeProps = {
  status: PortfolioStatus
}

export function PortfolioStatusBadge({ status }: PortfolioStatusBadgeProps) {
  const { t } = useTranslation("portfolios")

  return (
    <Badge variant={statusBadgeVariant[status] as BadgeVariant}>
      {t(`status.${status}`)}
    </Badge>
  )
}
