import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { RosterTab } from "@/features/roster/components/roster-tab.component"
import type { EventStatus } from "@/features/events/types/event.types"
import { server } from "../../../msw/server"
import {
  addRosterClient,
  confirmRosterImport,
  createRosterImport,
  getRoster,
  getRosterNotFound,
  makeImportRecord,
  makeRosterMember,
  makeRosterView,
} from "../../../msw/roster.handlers"
import { getReadiness, makeReadiness } from "../../../msw/events.handlers"
import { createTestQueryClient } from "../../../helpers/render"
import { installRadixJsdomShims } from "../../../helpers/radix"

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

installRadixJsdomShims()

function renderTab(status: EventStatus = "draft", client?: QueryClient) {
  return render(
    <QueryClientProvider client={client ?? createTestQueryClient()}>
      <RosterTab eventId="e-1" eventStatus={status} />
    </QueryClientProvider>,
  )
}

function csvFile() {
  return new File(["name,email,company\n"], "roster.csv", { type: "text/csv" })
}

describe("RosterTab", () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
  })

  it("uploads, previews counts and invalid/duplicate rows, then confirms into the roster view", async () => {
    const client = createTestQueryClient()
    server.use(
      getRosterNotFound(),
      createRosterImport(
        makeImportRecord({
          importedCount: 5,
          acceptedCount: 3,
          invalidCount: 1,
          duplicateCount: 1,
        }),
      ),
      confirmRosterImport(),
      getReadiness(makeReadiness()),
    )
    const user = userEvent.setup()
    renderTab("draft", client)

    const input = await screen.findByText(/upload roster/i)
    expect(input).toBeInTheDocument()

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await user.upload(fileInput, csvFile())
    await user.click(screen.getByRole("button", { name: /upload and preview/i }))

    expect(await screen.findByText(/import preview/i)).toBeInTheDocument()
    expect(screen.getByText("Invalid rows")).toBeInTheDocument()
    expect(screen.getByText("Duplicate rows")).toBeInTheDocument()
    expect(screen.getByText("Invalid email")).toBeInTheDocument()

    server.use(getRoster(makeRosterView()))
    await user.click(screen.getByRole("button", { name: /confirm import/i }))

    expect(await screen.findByText("raphen@drake.test")).toBeInTheDocument()
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
  })

  it("invalidates the readiness query after a confirm", async () => {
    const client = createTestQueryClient()
    await client.fetchQuery({
      queryKey: ["events", "detail", "e-1", "readiness"],
      queryFn: async () => makeReadiness({ rosterUploaded: false }),
    })
    const before = client.getQueryState(["events", "detail", "e-1", "readiness"])
      ?.dataUpdatedAt

    server.use(
      getRosterNotFound(),
      createRosterImport(makeImportRecord()),
      confirmRosterImport(),
      getReadiness(makeReadiness()),
    )
    const user = userEvent.setup()
    renderTab("draft", client)

    await screen.findByText(/upload roster/i)
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await user.upload(fileInput, csvFile())
    await user.click(screen.getByRole("button", { name: /upload and preview/i }))
    await screen.findByText(/import preview/i)
    await user.click(screen.getByRole("button", { name: /confirm import/i }))

    await waitFor(() => {
      const after = client.getQueryState([
        "events",
        "detail",
        "e-1",
        "readiness",
      ])?.dataUpdatedAt
      expect(after).not.toBe(before)
    })
  })

  it("shows the roster view with a Draft-only re-import button", async () => {
    server.use(getRoster(makeRosterView()))
    renderTab("draft")

    expect(await screen.findByText("raphen@drake.test")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /re-import roster/i }),
    ).toBeInTheDocument()
  })

  it("adds a client manually through the dialog from the roster view", async () => {
    const capture: { body?: Record<string, unknown>; calls?: number } = {}
    server.use(
      getRoster(makeRosterView()),
      addRosterClient(makeRosterMember(), capture),
      getReadiness(makeReadiness()),
    )
    const user = userEvent.setup()
    renderTab("draft")

    await screen.findByText("raphen@drake.test")
    await user.click(screen.getByRole("button", { name: /add client/i }))

    await user.type(await screen.findByLabelText(/name/i), "Cassian")
    await user.type(screen.getByLabelText(/email/i), "cassian@drake.test")
    await user.click(screen.getByRole("button", { name: /add to roster/i }))

    await waitFor(() => expect(capture.calls).toBe(1))
    expect(capture.body).toMatchObject({
      name: "Cassian",
      email: "cassian@drake.test",
    })
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
  })

  it("locks re-import and shows a notice when the event is not Draft", async () => {
    server.use(getRoster(makeRosterView()))
    renderTab("active")

    expect(await screen.findByText("raphen@drake.test")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /re-import roster/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/locked once the event leaves draft/i)).toBeInTheDocument()
  })

  it("blocks upload entirely when there is no roster and the event is not Draft", async () => {
    server.use(getRosterNotFound())
    renderTab("active")

    expect(
      await screen.findByText(/roster import is only available while the event is in/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/upload roster/i)).not.toBeInTheDocument()
  })
})
