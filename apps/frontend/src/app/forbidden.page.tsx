import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Routes } from "@/lib/constants/routes.constants"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/css/classes"

export function ForbiddenPage() {
  const { t } = useTranslation("common")

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
      <p className="text-sm font-medium text-gold">{t("forbidden.code")}</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("forbidden.title")}
      </h1>
      <p className="max-w-prose text-sm text-muted-foreground">
        {t("forbidden.description")}
      </p>
      <Link to={Routes.home} className={cn(buttonVariants({ variant: "outline" }))}>
        {t("forbidden.back")}
      </Link>
    </main>
  )
}
