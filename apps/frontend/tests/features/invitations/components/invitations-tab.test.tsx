import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { InvitationsTab } from "@/features/invitations/components/invitations-tab.component"
import { server } from "../../../msw/server"
import {
  createDispatch,
  createDispatchError,
  downloadReport,
  generateInvitations,
  generateInvitationsError,
  getDispatch,
  listInvitations,
  makeListView,
  makeMonitoring,
  makeProgress,
} from "../../../msw/invitations.handlers"
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

function renderTab(client?: QueryClient) {
  return render(
    <QueryClientProvider client={client ?? createTestQueryClient()}>
      <InvitationsTab eventId="e-1" />
    </QueryClientProvider>,
  )
}

describe("InvitationsTab", () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders the monitoring counters and the invitations table", async () => {
    server.use(listInvitations(() => makeListView()))
    renderTab()

    expect(await screen.findByText("raphen@drake.test")).toBeInTheDocument()
    expect(screen.getByText("vulkan@drake.test")).toBeInTheDocument()
    expect(screen.getByText("Total")).toBeInTheDocument()
    expect(screen.getByText("Queued")).toBeInTheDocument()
    expect(screen.getAllByText("Confirmed").length).toBeGreaterThanOrEqual(1)
  })

  it("generates invitations and toasts created counts", async () => {
    server.use(
      listInvitations(() => makeListView()),
      generateInvitations(),
      getReadiness(makeReadiness()),
    )
    const user = userEvent.setup()
    renderTab()

    await screen.findByText("raphen@drake.test")
    await user.click(screen.getByRole("button", { name: /generate invitations/i }))

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        expect.stringMatching(/3\/3 invitations/i),
      ),
    )
  })

  it("surfaces INVITATIONS_ROSTER_MISSING on generate", async () => {
    server.use(listInvitations(() => makeListView()), generateInvitationsError())
    const user = userEvent.setup()
    renderTab()

    await screen.findByText("raphen@drake.test")
    await user.click(screen.getByRole("button", { name: /generate invitations/i }))

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        expect.stringMatching(/upload a roster/i),
      ),
    )
  })

  it("filters the list by status via the Select", async () => {
    const capture: { status?: string | null } = {}
    server.use(
      listInvitations((status) => {
        if (status === "sent") {
          return makeListView({
            invitations: makeListView().invitations.filter(
              (item) => item.invitation.status === "sent",
            ),
            monitoring: makeMonitoring({ total: 1, pending: 0, sent: 1 }),
          })
        }
        return makeListView()
      }, capture),
    )
    const user = userEvent.setup()
    renderTab()

    await screen.findByText("raphen@drake.test")
    await user.click(screen.getByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "Sent" }))

    await waitFor(() => expect(capture.status).toBe("sent"))
    await waitFor(() =>
      expect(screen.queryByText("raphen@drake.test")).not.toBeInTheDocument(),
    )
    expect(screen.getByText("vulkan@drake.test")).toBeInTheDocument()
  })

  it("send dialog dispatches and the progress reflects status flips", async () => {
    let progressCalls = 0
    server.use(
      listInvitations(() => makeListView({ monitoring: makeMonitoring({ pending: 3 }) })),
      createDispatch(),
      getDispatch(() => {
        progressCalls += 1
        return progressCalls <= 1
          ? makeProgress("d-1", { pending: 0, queued: 3 })
          : makeProgress("d-1", { pending: 0, queued: 0, sent: 3 })
      }),
    )
    const user = userEvent.setup()
    renderTab()

    await screen.findByText("raphen@drake.test")
    await user.click(screen.getByRole("button", { name: /send invitations/i }))
    await user.click(await screen.findByRole("button", { name: /confirm and send/i }))

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).getByText(/sending is running in the background/i),
    ).toBeInTheDocument()

    await waitFor(
      () => {
        const sent = within(dialog).getByText("Sent")
        expect(sent.nextElementSibling).toHaveTextContent("3")
      },
      { timeout: 8000 },
    )
  }, 12000)

  it("surfaces DISPATCH_TEMPLATE_MISSING on send", async () => {
    server.use(
      listInvitations(() =>
        makeListView({ monitoring: makeMonitoring({ pending: 3 }) }),
      ),
      createDispatchError(),
    )
    const user = userEvent.setup()
    renderTab()

    await screen.findByText("raphen@drake.test")
    await user.click(screen.getByRole("button", { name: /send invitations/i }))
    await user.click(await screen.findByRole("button", { name: /confirm and send/i }))

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        expect.stringMatching(/configure the email template/i),
      ),
    )
  })

  it("disables Send when there are no pending invitations", async () => {
    server.use(
      listInvitations(() =>
        makeListView({
          monitoring: makeMonitoring({ pending: 0, sent: 3, total: 3 }),
        }),
      ),
    )
    renderTab()

    await screen.findByText("raphen@drake.test")
    expect(screen.getByRole("button", { name: /send invitations/i })).toBeDisabled()
  })

  it("invokes the report download", async () => {
    const reportCalls = { calls: 0 }
    server.use(
      listInvitations(() => makeListView()),
      downloadReport("email,status\na@b.co,pending\n", reportCalls),
    )
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:report")
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
    const user = userEvent.setup()
    renderTab()

    await screen.findByText("raphen@drake.test")
    await user.click(screen.getByRole("button", { name: /export report/i }))

    await waitFor(() => expect(reportCalls.calls).toBe(1))
  })

  it("invalidates the readiness query after generation", async () => {
    const client = createTestQueryClient()
    await client.fetchQuery({
      queryKey: ["events", "detail", "e-1", "readiness"],
      queryFn: async () => makeReadiness({ inviteTokensReady: false }),
    })
    const before = client.getQueryState(["events", "detail", "e-1", "readiness"])
      ?.dataUpdatedAt

    server.use(
      listInvitations(() => makeListView()),
      generateInvitations(),
      getReadiness(makeReadiness()),
    )
    const user = userEvent.setup()
    renderTab(client)

    await screen.findByText("raphen@drake.test")
    await user.click(screen.getByRole("button", { name: /generate invitations/i }))

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
})
