import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventsTable } from "@/features/events/components/events-table.component"
import { useEvents } from "@/features/events/hooks/events.hook"
import { Routes } from "@/lib/constants/routes.constants"

export function EventsPage() {
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
  } = useEvents()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">
            {t("list.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("list.subtitle")}
          </p>
        </div>
        <Button asChild className="h-11 w-full sm:w-auto">
          <Link to={Routes.eventsNew}>
            <Plus />
            {t("list.new")}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" aria-label={t("loading")} />
        </div>
      ) : isError ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {t("list.loadError")}
        </p>
      ) : (
        <>
          <EventsTable events={items} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t("list.count", { count })} ·{" "}
              {t("list.pageInfo", { page: page + 1, pageCount })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-11 flex-1 sm:flex-none md:h-9"
                onClick={previousPage}
                disabled={!hasPreviousPage}
              >
                {t("list.previous")}
              </Button>
              <Button
                variant="outline"
                className="h-11 flex-1 sm:flex-none md:h-9"
                onClick={nextPage}
                disabled={!hasNextPage}
              >
                {t("list.next")}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
