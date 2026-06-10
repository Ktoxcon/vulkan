import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useEventOfferings } from "@/features/events/hooks/event-offerings.hook"
import { useRemoveOffering } from "@/features/events/hooks/remove-offering.hook"
import { OfferingPicker } from "@/features/events/components/offering-picker.component"
import type { AssignedOffering } from "@/features/events/types/event.types"
import { resolveError } from "@/lib/errors/resolve-error"
import { formatPrice } from "@/lib/formatters/price.formatter"

type EventOfferingsPanelProps = { eventId: string }

export function EventOfferingsPanel({ eventId }: EventOfferingsPanelProps) {
  const { t } = useTranslation("events")
  const [pickerOpen, setPickerOpen] = useState(false)
  const { offerings, isLoading, isError } = useEventOfferings(eventId)
  const removeOffering = useRemoveOffering()

  const remove = (assigned: AssignedOffering) => {
    removeOffering.mutate(
      { eventId, eventOfferingId: assigned.id },
      {
        onSuccess: () =>
          toast.success(
            t("toast.offeringRemoved", { name: assigned.offering.name })
          ),
        onError: (error) => toast.error(resolveError(error)),
      }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t("offerings.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("offerings.subtitle")}
          </p>
        </div>
        <Button
          className="h-11 w-full sm:w-auto"
          onClick={() => setPickerOpen(true)}
        >
          <Plus />
          {t("offerings.add")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" aria-label={t("loading")} />
        </div>
      ) : isError ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {t("offerings.loadError")}
        </p>
      ) : offerings.length === 0 ? (
        <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">
          {t("offerings.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {offerings.map((assigned) => (
            <li
              key={assigned.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{assigned.offering.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {t("offerings.meta", {
                    type: assigned.offering.type,
                    price: formatPrice(assigned.offering.basePrice),
                  })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-11 shrink-0 md:h-9"
                onClick={() => remove(assigned)}
                disabled={removeOffering.isPending}
              >
                <Trash2 />
                {t("offerings.remove")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <OfferingPicker
        eventId={eventId}
        assignedIds={offerings.map((assigned) => assigned.offering.id)}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
      />
    </div>
  )
}
