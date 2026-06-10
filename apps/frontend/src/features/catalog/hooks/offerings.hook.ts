import { useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { OfferingsClient } from "@/lib/clients/offerings.client"
import { CATALOG_PAGE_SIZE, catalogQueryKey } from "@/features/catalog/constants/offering.constants"
import type { OfferingListResult } from "@/features/catalog/types/offering.types"

export function useOfferings({
  page: initialPage = 0,
  type,
  isActive,
  search,
}: {
  page?: number
  type?: string
  isActive?: boolean
  search?: string
} = {}) {
  const [page, setPage] = useState(initialPage)

  const query = useQuery<OfferingListResult>({
    queryKey: [...catalogQueryKey, "list", page, type, isActive, search],
    queryFn: () =>
      OfferingsClient.list({
        type,
        isActive,
        search,
        limit: CATALOG_PAGE_SIZE,
        offset: page * CATALOG_PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  })

  const count = query.data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(count / CATALOG_PAGE_SIZE))
  const hasNextPage = page + 1 < pageCount
  const hasPreviousPage = page > 0

  return {
    items: query.data?.items ?? [],
    count,
    page,
    pageCount,
    pageSize: CATALOG_PAGE_SIZE,
    hasNextPage,
    hasPreviousPage,
    nextPage: () => setPage((current) => (hasNextPage ? current + 1 : current)),
    previousPage: () => setPage((current) => (current > 0 ? current - 1 : current)),
    setPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
