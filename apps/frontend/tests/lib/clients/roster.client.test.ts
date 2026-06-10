import { describe, expect, it } from "vitest"
import { RosterClient } from "@/lib/clients/roster.client"
import { ApiError } from "@/lib/errors/api.error"
import { server } from "../../msw/server"
import {
  addRosterClient,
  addRosterClientDuplicate,
  confirmRosterImport,
  createRosterImport,
  createRosterImportError,
  getRoster,
  getRosterNotFound,
  makeImportRecord,
  makeRosterMember,
  makeRosterView,
} from "../../msw/roster.handlers"

describe("RosterClient", () => {
  it("uploads a multipart file and returns the import preview", async () => {
    const capture: { fileName?: string; hasFile?: boolean; contentType?: string | null } = {}
    server.use(createRosterImport(makeImportRecord({ acceptedCount: 3 }), capture))

    const file = new File(["name,email,company\n"], "roster.csv", {
      type: "text/csv",
    })
    const record = await RosterClient.createImport("e-1", file)

    expect(capture.hasFile).toBe(true)
    expect(capture.contentType).toMatch(/multipart\/form-data/)
    expect(record.acceptedCount).toBe(3)
    expect(record.status).toBe("pending")
  })

  it("surfaces an ApiError on a locked event", async () => {
    server.use(createRosterImportError())
    const file = new File(["x"], "roster.csv", { type: "text/csv" })

    const error = await RosterClient.createImport("e-1", file).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe("EVENT_LOCKED_FOR_ROSTER")
  })

  it("confirms an import with status:confirmed", async () => {
    const capture: { body?: Record<string, unknown>; importId?: string } = {}
    server.use(confirmRosterImport(undefined, capture))

    const roster = await RosterClient.confirmImport("e-1", "imp-9")

    expect(capture.body).toEqual({ status: "confirmed" })
    expect(capture.importId).toBe("imp-9")
    expect(roster.eventId).toBe("e-1")
  })

  it("returns the roster view", async () => {
    server.use(getRoster(makeRosterView()))

    const view = await RosterClient.getRoster("e-1")

    expect(view.clients).toHaveLength(3)
    expect(view.roster.eventId).toBe("e-1")
  })

  it("throws a 404 ApiError when there is no roster", async () => {
    server.use(getRosterNotFound())

    const error = await RosterClient.getRoster("e-1").catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(404)
  })

  it("adds a client and returns the new roster member", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(
      addRosterClient(makeRosterMember({ email: "numeon@drake.test" }), capture),
    )

    const member = await RosterClient.addClient("e-1", {
      name: "Numeon",
      email: "numeon@drake.test",
      company: null,
    })

    expect(capture.body).toEqual({
      name: "Numeon",
      email: "numeon@drake.test",
      company: null,
    })
    expect(member.email).toBe("numeon@drake.test")
    expect(member.rosterClientId).toBeTruthy()
  })

  it("surfaces a ROSTER_CLIENT_DUPLICATE ApiError", async () => {
    server.use(addRosterClientDuplicate())

    const error = await RosterClient.addClient("e-1", {
      name: "Dup",
      email: "raphen@drake.test",
      company: null,
    }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe("ROSTER_CLIENT_DUPLICATE")
  })
})
