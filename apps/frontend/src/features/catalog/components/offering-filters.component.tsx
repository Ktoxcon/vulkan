import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  offeringTypeOptions,
  OFFERING_TYPE_ALL,
  SEARCH_DEBOUNCE_MS,
  statusFilterOptions,
} from "@/features/catalog/constants/offering.constants"
import type { OfferingStatusFilter } from "@/features/catalog/types/offering.types"

type OfferingFiltersProps = {
  type: string
  status: OfferingStatusFilter
  search: string
  onTypeChange: (value: string) => void
  onStatusChange: (value: OfferingStatusFilter) => void
  onSearchChange: (value: string) => void
}

export function OfferingFilters({
  type,
  status,
  search,
  onTypeChange,
  onStatusChange,
  onSearchChange,
}: OfferingFiltersProps) {
  const { t } = useTranslation("catalog")
  const [searchInput, setSearchInput] = useState(search)
  const [lastSearch, setLastSearch] = useState(search)

  if (search !== lastSearch) {
    setLastSearch(search)
    setSearchInput(search)
  }

  useEffect(() => {
    if (searchInput === search) return
    const timer = setTimeout(() => onSearchChange(searchInput), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, search, onSearchChange])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="offering-type-filter">{t("filters.type.label")}</Label>
        <Select
          value={type || OFFERING_TYPE_ALL}
          onValueChange={(value) => onTypeChange(value === OFFERING_TYPE_ALL ? "" : value)}
        >
          <SelectTrigger id="offering-type-filter" className="h-11 w-full">
            <SelectValue placeholder={t("filters.type.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={OFFERING_TYPE_ALL}>{t("filters.type.all")}</SelectItem>
            {offeringTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(`typeOptions.${option.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="offering-status-filter">{t("filters.status.label")}</Label>
        <Select
          value={status}
          onValueChange={(value) => onStatusChange(value as OfferingStatusFilter)}
        >
          <SelectTrigger id="offering-status-filter" className="h-11 w-full">
            <SelectValue placeholder={t("filters.status.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {statusFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(`statusOptions.${option.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="offering-search-filter">{t("filters.search.label")}</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="offering-search-filter"
            type="search"
            placeholder={t("filters.search.placeholder")}
            className="h-11 pl-9"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
