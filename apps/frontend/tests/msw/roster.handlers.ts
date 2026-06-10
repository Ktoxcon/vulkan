import { http, HttpResponse } from "msw"
import type {
  ImportRecord,
  Roster,
  RosterMember,
  RosterView,
} from "@/features/roster/types/roster.types"
import { apiUrl } from "./handlers"

export function makeImportRecord(overrides: Partial<ImportRecord> = {}): ImportRecord {
  return {
    id: "imp-1",
    status: "pending",
    fileName: "roster.csv",
    importedCount: 5,
    invalidCount: 1,
    duplicateCount: 1,
    acceptedCount: 3,
    validRows: [
      { name: " Raphen", email: "raphen@drake.test", company: "Forge Co" },
      { name: "Vulkan", email: "vulkan@drake.test", company: null },
      { name: "Tu shan", email: "tushan@drake.test", company: "Nocturne" },
    ],
    invalidRows: [
      {
        rowNumber: 4,
        raw: { name: "Bad Row", email: "not-an-email", company: "" },
        errors: ["Invalid email"],
      },
    ],
    duplicateRows: [{ rowNumber: 5, email: "vulkan@drake.test" }],
    ...overrides,
  }
}

export function makeRosterView(overrides: Partial<RosterView> = {}): RosterView {
  return {
    roster: {
      id: "r-1",
      eventId: "e-1",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    },
    clients: [
      { id: "c-1", name: "Raphen", email: "raphen@drake.test", company: "Forge Co" },
      { id: "c-2", name: "Vulkan", email: "vulkan@drake.test", company: null },
      { id: "c-3", name: "Tu Shan", email: "tushan@drake.test", company: "Nocturne" },
    ],
    ...overrides,
  }
}

export const createRosterImport = (
  record: ImportRecord = makeImportRecord(),
  capture?: { fileName?: string; hasFile?: boolean; contentType?: string | null; calls?: number },
) =>
  http.post(apiUrl("/events/:eventId/roster-imports"), async ({ request }) => {
    const contentType = request.headers.get("content-type")
    const body = await request.text()
    const match = body.match(/filename="([^"]+)"/)
    if (capture) {
      capture.calls = (capture.calls ?? 0) + 1
      capture.contentType = contentType
      capture.hasFile = match !== null
      capture.fileName = match?.[1]
    }
    return HttpResponse.json({ success: true, data: record }, { status: 201 })
  })

export const createRosterImportError = (
  code = "EVENT_LOCKED_FOR_ROSTER",
  message = "Roster import is only available while the event is in Draft.",
  status = 409,
) =>
  http.post(apiUrl("/events/:eventId/roster-imports"), () =>
    HttpResponse.json({ success: false, code, message }, { status }),
  )

export const confirmRosterImport = (
  roster: Roster = makeRosterView().roster,
  capture?: { body?: Record<string, unknown>; importId?: string; calls?: number },
) =>
  http.patch(
    apiUrl("/events/:eventId/roster-imports/:importId"),
    async ({ request, params }) => {
      const body = (await request.json()) as Record<string, unknown>
      if (capture) {
        capture.body = body
        capture.importId = params.importId as string
        capture.calls = (capture.calls ?? 0) + 1
      }
      return HttpResponse.json({ success: true, data: roster })
    },
  )

export const getRoster = (view: RosterView = makeRosterView()) =>
  http.get(apiUrl("/events/:eventId/roster"), () =>
    HttpResponse.json({ success: true, data: view }),
  )

export const getRosterNotFound = () =>
  http.get(apiUrl("/events/:eventId/roster"), () =>
    HttpResponse.json(
      { success: false, code: "ROSTER_NOT_FOUND", message: "No roster yet." },
      { status: 404 },
    ),
  )

export function makeRosterMember(
  overrides: Partial<RosterMember> = {},
): RosterMember {
  return {
    rosterClientId: "rc-9",
    clientId: "c-9",
    name: "Cassian",
    email: "cassian@drake.test",
    company: "Forge Co",
    createdAt: "2026-06-08T00:00:00.000Z",
    ...overrides,
  }
}

export const addRosterClient = (
  member: RosterMember = makeRosterMember(),
  capture?: { body?: Record<string, unknown>; calls?: number },
) =>
  http.post(apiUrl("/events/:eventId/roster-clients"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    if (capture) {
      capture.body = body
      capture.calls = (capture.calls ?? 0) + 1
    }
    return HttpResponse.json({ success: true, data: member }, { status: 201 })
  })

export const addRosterClientDuplicate = () =>
  http.post(apiUrl("/events/:eventId/roster-clients"), () =>
    HttpResponse.json(
      {
        success: false,
        code: "ROSTER_CLIENT_DUPLICATE",
        message: "A client with this email is already on the roster.",
      },
      { status: 409 },
    ),
  )
