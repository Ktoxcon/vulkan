import { http, HttpResponse } from "msw"
import type { OfferingImportRecord } from "@/features/catalog/types/offering.types"
import { apiUrl } from "./handlers"

export function makeImportRecord(
  overrides: Partial<OfferingImportRecord> = {},
): OfferingImportRecord {
  return {
    id: "imp-1",
    status: "pending",
    fileName: "catalog.csv",
    processedCount: 3,
    importedCount: 2,
    duplicateCount: 1,
    invalidCount: 1,
    validRows: [
      {
        name: "Forge Hammer",
        type: "product",
        description: "Heavy tool",
        basePrice: "300.00",
      },
      {
        name: "Tactical Briefing",
        type: "service",
        description: null,
        basePrice: "150.00",
      },
    ],
    invalidRows: [
      {
        rowNumber: 4,
        raw: { name: "Broken", type: "weapon", description: "", basePrice: "x" },
        errors: ["type must be product or service", "basePrice must be a number"],
      },
    ],
    duplicateRows: [
      {
        rowNumber: 5,
        name: "Drakescale Plate",
        type: "product",
      },
    ],
    ...overrides,
  }
}

export const createImportSuccess = (
  capture?: { multipart?: boolean },
  record: OfferingImportRecord = makeImportRecord(),
) =>
  http.post(apiUrl("/offering-imports"), ({ request }) => {
    const contentType = request.headers.get("content-type") ?? ""
    if (capture) {
      capture.multipart = contentType.includes("multipart/form-data")
    }
    return HttpResponse.json({ success: true, data: record }, { status: 201 })
  })

export const createImportError = (
  code = "OFFERING_IMPORT_FILE_TYPE",
  message = "The uploaded file must be a CSV.",
  status = 400,
) =>
  http.post(apiUrl("/offering-imports"), () =>
    HttpResponse.json({ success: false, code, message }, { status }),
  )

export const getImport = (record: OfferingImportRecord) =>
  http.get(apiUrl(`/offering-imports/${record.id}`), () =>
    HttpResponse.json({ success: true, data: record }),
  )

export const confirmImportSuccess = (
  capture?: { body?: Record<string, unknown>; id?: string },
  record: OfferingImportRecord = makeImportRecord({
    status: "confirmed",
    importedCount: 2,
    invalidRows: [],
    duplicateRows: [],
  }),
) =>
  http.patch(
    apiUrl("/offering-imports/:importId"),
    async ({ request, params }) => {
      if (capture) {
        capture.body = (await request.json()) as Record<string, unknown>
        capture.id = params.importId as string
      }
      return HttpResponse.json({ success: true, data: record })
    },
  )
