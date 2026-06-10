import { useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Loader2, Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OfferingFilters } from "@/features/catalog/components/offering-filters.component"
import { OfferingsTable } from "@/features/catalog/components/offerings-table.component"
import { useOfferings } from "@/features/catalog/hooks/offerings.hook"
import { Routes } from "@/lib/constants/routes.constants"

type StatusFilter = "active" | "inactive" | "all"

export function CatalogPage() {
  const { t } = useTranslation("catalog")
  const [type, setType] = useState("")
  const [status, setStatus] = useState<StatusFilter>("active")
  const [search, setSearch] = useState("")

  const {
    items,
    count,
    page,
    pageCount,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    setPage,
    isLoading,
    isError,
  } = useOfferings({
    type: type || undefined,
    isActive: status === "active" ? true : status === "inactive" ? false : undefined,
    search: search || undefined,
  })

  const onTypeChange = (value: string) => {
    setPage(0)
    setType(value)
  }

  const onStatusChange = (value: StatusFilter) => {
    setPage(0)
    setStatus(value)
  }

  const onSearchChange = (value: string) => {
    setPage(0)
    setSearch(value)
  }

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
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="h-11 w-full sm:w-auto">
            <Link to={Routes.catalogImport}>
              <Upload />
              {t("actions.import")}
            </Link>
          </Button>
          <Button asChild className="h-11 w-full sm:w-auto">
            <Link to={Routes.catalogNew}>
              <Plus />
              {t("actions.new")}
            </Link>
          </Button>
        </div>
      </div>

      <OfferingFilters
        type={type}
        status={status}
        search={search}
        onTypeChange={onTypeChange}
        onStatusChange={onStatusChange}
        onSearchChange={onSearchChange}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" aria-label={t("list.loading")} />
        </div>
      ) : isError ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {t("list.error")}
        </p>
      ) : (
        <>
          <OfferingsTable offerings={items} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t("list.count", { count, page: page + 1, pageCount })}
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
