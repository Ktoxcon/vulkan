import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { UsersClient } from "@/lib/clients/users.client"
import { USERS_PAGE_SIZE, usersQueryKey } from "@/features/users/constants/user.constants"
import type { UserListResult } from "@/features/users/types/user.types"

export function useUsers({ page: initialPage = 0 }: { page?: number } = {}) {
  const [page, setPage] = useState(initialPage)

  const query = useQuery<UserListResult>({
    queryKey: [...usersQueryKey, "list", page],
    queryFn: () =>
      UsersClient.list({ limit: USERS_PAGE_SIZE, offset: page * USERS_PAGE_SIZE }),
  })

  const count = query.data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(count / USERS_PAGE_SIZE))
  const hasNextPage = page + 1 < pageCount
  const hasPreviousPage = page > 0

  return {
    items: query.data?.items ?? [],
    count,
    page,
    pageCount,
    pageSize: USERS_PAGE_SIZE,
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
