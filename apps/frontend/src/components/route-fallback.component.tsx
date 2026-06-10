import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

export function RouteFallback() {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <Loader2
        className="size-6 animate-spin text-muted-foreground"
        aria-label={t("routeFallback.loading")}
      />
    </div>
  )
}
