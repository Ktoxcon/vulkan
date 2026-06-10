import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"

type OfferingStatusBadgeProps = {
  isActive: boolean
}

export function OfferingStatusBadge({ isActive }: OfferingStatusBadgeProps) {
  const { t } = useTranslation("catalog")
  return (
    <Badge variant={isActive ? "default" : "outline"}>
      {isActive ? t("status.active") : t("status.inactive")}
    </Badge>
  )
}
