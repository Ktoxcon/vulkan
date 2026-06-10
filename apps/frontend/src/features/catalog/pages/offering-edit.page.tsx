import { Link, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { OfferingForm } from "@/features/catalog/components/offering-form.component"
import { useOffering } from "@/features/catalog/hooks/offering.hook"
import { useUpdateOffering } from "@/features/catalog/hooks/update-offering.hook"
import { Routes } from "@/lib/constants/routes.constants"
import type { UpdateOfferingInput } from "@/features/catalog/types/offering.types"

export function OfferingEditPage() {
  const { t } = useTranslation("catalog")
  const { offeringId } = useParams<{ offeringId: string }>()
  const navigate = useNavigate()
  const { offering, isLoading, isError } = useOffering(offeringId)
  const updateOffering = useUpdateOffering(offeringId ?? "")

  const onSubmit = (patch: UpdateOfferingInput) => {
    updateOffering.mutate(patch, {
      onSuccess: (updated) => {
        toast.success(t("toast.updated", { name: updated.name }))
        navigate(Routes.catalog)
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-11 w-fit px-2 md:h-9"
        >
          <Link to={Routes.catalog}>
            <ArrowLeft />
            {t("actions.backToCatalog")}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">
          {t("edit.title")}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" aria-label={t("list.loading")} />
        </div>
      ) : isError || !offering ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm font-medium text-destructive">
            {t("edit.notFound")}
          </p>
          <Button asChild variant="outline" className="h-11 md:h-9">
            <Link to={Routes.catalog}>{t("actions.backToCatalog")}</Link>
          </Button>
        </div>
      ) : (
        <OfferingForm
          mode="edit"
          offering={offering}
          onSubmit={onSubmit}
          pending={updateOffering.isPending}
          error={updateOffering.error}
        />
      )}
    </div>
  )
}
