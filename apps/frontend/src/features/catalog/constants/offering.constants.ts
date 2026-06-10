export const catalogQueryKey = ["catalog"] as const

export const CATALOG_PAGE_SIZE = 10

export const SEARCH_DEBOUNCE_MS = 300

export const OFFERING_TYPE_ALL = "all"

export const offeringTypeOptions = [
  { value: "product" },
  { value: "service" },
] as const

export const statusFilterOptions = [
  { value: "active" },
  { value: "inactive" },
  { value: "all" },
] as const
