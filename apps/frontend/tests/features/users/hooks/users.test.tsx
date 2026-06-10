import { describe, expect, it } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useUsers } from "@/features/users/hooks/users.hook"
import { server } from "../../../msw/server"
import { listUsersPaged, makeUsers } from "../../../msw/users.handlers"
import { createTestQueryClient } from "../../../helpers/render"

function wrapper() {
  const client = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe("useUsers", () => {
  it("loads the first page and computes pagination from count", async () => {
    const capture: { limit?: number; offset?: number } = {}
    server.use(listUsersPaged(makeUsers(25), capture))

    const { result } = renderHook(() => useUsers(), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(capture.limit).toBe(10)
    expect(capture.offset).toBe(0)
    expect(result.current.count).toBe(25)
    expect(result.current.items).toHaveLength(10)
    expect(result.current.pageCount).toBe(3)
    expect(result.current.page).toBe(0)
    expect(result.current.hasPreviousPage).toBe(false)
    expect(result.current.hasNextPage).toBe(true)
  })

  it("nextPage advances the offset and fetches the next slice", async () => {
    const capture: { limit?: number; offset?: number } = {}
    server.use(listUsersPaged(makeUsers(25), capture))

    const { result } = renderHook(() => useUsers(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.nextPage())

    await waitFor(() => expect(result.current.page).toBe(1))
    await waitFor(() => expect(capture.offset).toBe(10))
    await waitFor(() => expect(result.current.items[0].id).toBe("u-11"))
    expect(result.current.hasPreviousPage).toBe(true)
  })

  it("previousPage goes back and clamps at the first page", async () => {
    server.use(listUsersPaged(makeUsers(25)))

    const { result } = renderHook(() => useUsers(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.nextPage())
    await waitFor(() => expect(result.current.page).toBe(1))

    act(() => result.current.previousPage())
    await waitFor(() => expect(result.current.page).toBe(0))

    act(() => result.current.previousPage())
    expect(result.current.page).toBe(0)
    expect(result.current.hasPreviousPage).toBe(false)
  })

  it("does not advance past the last page", async () => {
    server.use(listUsersPaged(makeUsers(15)))

    const { result } = renderHook(() => useUsers(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.pageCount).toBe(2)

    act(() => result.current.nextPage())
    await waitFor(() => expect(result.current.page).toBe(1))
    expect(result.current.hasNextPage).toBe(false)

    act(() => result.current.nextPage())
    expect(result.current.page).toBe(1)
  })
})
