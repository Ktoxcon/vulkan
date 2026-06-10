import { Link } from "react-router"
import { CalendarDays } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/features/auth/hooks/auth.hook"
import { Button } from "@/components/ui/button"
import { Routes } from "@/lib/constants/routes.constants"

export function SalesLandingPage() {
  const { t } = useTranslation("dashboard")
  const { user } = useAuth()

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("sales.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("sales.greeting", { name: user?.name ?? t("sales.fallbackName") })}
        </p>
      </div>
      <Button asChild className="h-11 w-full sm:w-auto">
        <Link to={Routes.events}>
          <CalendarDays />
          {t("sales.actions.goToEvents")}
        </Link>
      </Button>
    </section>
  )
}
