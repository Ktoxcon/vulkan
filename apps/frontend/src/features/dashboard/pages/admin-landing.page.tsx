import { useTranslation } from "react-i18next"
import { useAuth } from "@/features/auth/hooks/auth.hook"

export function AdminLandingPage() {
  const { t } = useTranslation("dashboard")
  const { user } = useAuth()

  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("admin.title")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("admin.greeting", { name: user?.name ?? t("admin.fallbackName") })}
      </p>
    </section>
  )
}
