import { describe, expect, it, vi, afterEach } from "vitest"
import { InvitationsClient } from "@/lib/clients/invitations.client"
import { ApiError } from "@/lib/errors/api.error"
import { server } from "../../msw/server"
import {
  createDispatch,
  createDispatchError,
  downloadReport,
  generateInvitations,
  generateInvitationsError,
  getDispatch,
  listInvitations,
  makeListView,
  makeProgress,
} from "../../msw/invitations.handlers"

describe("InvitationsClient", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("generates invitations and returns counts", async () => {
    server.use(generateInvitations())

    const result = await InvitationsClient.generate("e-1")

    expect(result.createdCount).toBe(3)
    expect(result.totalRosterClients).toBe(3)
  })

  it("surfaces INVITATIONS_ROSTER_MISSING", async () => {
    server.use(generateInvitationsError())

    const error = await InvitationsClient.generate("e-1").catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe("INVITATIONS_ROSTER_MISSING")
  })

  it("lists invitations with monitoring and forwards the status filter", async () => {
    const capture: { status?: string | null } = {}
    server.use(listInvitations(() => makeListView(), capture))

    const view = await InvitationsClient.list("e-1", { status: "sent" })

    expect(capture.status).toBe("sent")
    expect(view.invitations).toHaveLength(3)
    expect(view.monitoring.total).toBe(3)
  })

  it("omits the status param when not provided", async () => {
    const capture: { status?: string | null } = {}
    server.use(listInvitations(() => makeListView(), capture))

    await InvitationsClient.list("e-1")

    expect(capture.status).toBeNull()
  })

  it("creates a dispatch", async () => {
    server.use(createDispatch())

    const result = await InvitationsClient.dispatch("e-1")

    expect(result.dispatchId).toBe("d-1")
    expect(result.queuedCount).toBe(3)
  })

  it("surfaces DISPATCH_TEMPLATE_MISSING", async () => {
    server.use(createDispatchError())

    const error = await InvitationsClient.dispatch("e-1").catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe("DISPATCH_TEMPLATE_MISSING")
  })

  it("reads dispatch progress", async () => {
    server.use(getDispatch(() => makeProgress("d-1", { sent: 2, pending: 1 })))

    const progress = await InvitationsClient.getDispatch("e-1", "d-1")

    expect(progress.sent).toBe(2)
    expect(progress.pending).toBe(1)
  })

  it("downloads the CSV report through the file-download path", async () => {
    server.use(downloadReport("email,status\na@b.co,pending\n"))
    const createUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:report")
    const revokeUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {})

    await InvitationsClient.downloadReport("e-1")

    expect(createUrl).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    expect(revokeUrl).toHaveBeenCalledWith("blob:report")
  })
})
