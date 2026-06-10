import { Link, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { OfferingForm } from "@/features/catalog/components/offering-form.component"
import { useCreateOffering } from "@/features/catalog/hooks/create-offering.hook"
import { Routes } from "@/lib/constants/routes.constants"
import type { CreateOfferingInput } from "@/features/catalog/types/offering.types"

export function OfferingCreatePage() {
  const { t } = useTranslation("catalog")
  const navigate = useNavigate()
  const createOffering = useCreateOffering()

  const onSubmit = (values: CreateOfferingInput) => {
    createOffering.mutate(values, {
      onSuccess: (offering) => {
        toast.success(t("toast.created", { name: offering.name }))
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
          {t("create.title")}
        </h1>
      </div>
      <OfferingForm
        mode="create"
        onSubmit={onSubmit}
        pending={createOffering.isPending}
        error={createOffering.error}
      />
    </div>
  )
}
