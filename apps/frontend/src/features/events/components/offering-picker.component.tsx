import { useTranslation } from "react-i18next"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useOfferingsCatalog } from "@/features/events/hooks/offerings-catalog.hook"
import { useAssignOffering } from "@/features/events/hooks/assign-offering.hook"
import type { Offering } from "@/features/catalog/types/offering.types"
import { resolveError } from "@/lib/errors/resolve-error"
import { formatPrice } from "@/lib/formatters/price.formatter"

type OfferingPickerProps = {
  eventId: string
  assignedIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OfferingPicker({
  eventId,
  assignedIds,
  open,
  onOpenChange,
}: OfferingPickerProps) {
  const { t } = useTranslation("events")
  const {
    items,
    count,
    page,
    pageCount,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    isLoading,
    isError,
  } = useOfferingsCatalog()
  const assignOffering = useAssignOffering()

  const assigned = new Set(assignedIds)
  const available = items.filter((offering) => !assigned.has(offering.id))

  const assign = (offering: Offering) => {
    assignOffering.mutate(
      { eventId, offeringId: offering.id },
      {
        onSuccess: () =>
          toast.success(t("toast.offeringAssigned", { name: offering.name })),
        onError: (error) => toast.error(resolveError(error)),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("offeringPicker.title")}</DialogTitle>
          <DialogDescription>
            {t("offeringPicker.description")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" aria-label={t("loading")} />
          </div>
        ) : isError ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {t("offeringPicker.loadError")}
          </p>
        ) : count === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("offeringPicker.emptyCatalog")}
          </p>
        ) : available.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("offeringPicker.allAssigned")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {available.map((offering) => (
              <li
                key={offering.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{offering.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t("offeringPicker.meta", {
                      type: offering.type,
                      price: formatPrice(offering.basePrice),
                    })}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-11 shrink-0 md:h-9"
                  onClick={() => assign(offering)}
                  disabled={assignOffering.isPending}
                >
                  <Plus />
                  {t("offeringPicker.assign")}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {pageCount > 1 && (
          <DialogFooter className="sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t("offeringPicker.pageInfo", { page: page + 1, pageCount })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-11 flex-1 sm:flex-none md:h-9"
                onClick={previousPage}
                disabled={!hasPreviousPage}
              >
                {t("offeringPicker.previous")}
              </Button>
              <Button
                variant="outline"
                className="h-11 flex-1 sm:flex-none md:h-9"
                onClick={nextPage}
                disabled={!hasNextPage}
              >
                {t("offeringPicker.next")}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
