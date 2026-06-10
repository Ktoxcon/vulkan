import { describe, expect, it } from "vitest"
import { OfferingImportsClient } from "@/lib/clients/offering-imports.client"
import { server } from "../../msw/server"
import {
  confirmImportSuccess,
  createImportError,
  createImportSuccess,
  getImport,
  makeImportRecord,
} from "../../msw/offering-imports.handlers"

function csvFile(name = "catalog.csv") {
  return new File(["name,type,description,basePrice\n"], name, {
    type: "text/csv",
  })
}

describe("OfferingImportsClient", () => {
  it("createImport posts multipart form data and returns the preview record", async () => {
    const capture: { multipart?: boolean } = {}
    server.use(createImportSuccess(capture, makeImportRecord({ id: "imp-9" })))

    const result = await OfferingImportsClient.createImport(csvFile("upload.csv"))

    expect(capture.multipart).toBe(true)
    expect(result.id).toBe("imp-9")
    expect(result.status).toBe("pending")
  })

  it("createImport returns invalidRows whose raw is an object", async () => {
    server.use(createImportSuccess())

    const result = await OfferingImportsClient.createImport(csvFile())

    expect(result.invalidRows[0].raw).toBeTypeOf("object")
    expect(Object.values(result.invalidRows[0].raw)).toContain("weapon")
    expect(result.invalidRows[0].errors.length).toBeGreaterThan(0)
  })

  it("createImport surfaces a file-type error from the backend", async () => {
    server.use(createImportError())

    await expect(
      OfferingImportsClient.createImport(csvFile()),
    ).rejects.toMatchObject({ code: "OFFERING_IMPORT_FILE_TYPE", status: 400 })
  })

  it("getImport reads a record by id", async () => {
    server.use(getImport(makeImportRecord({ id: "imp-2" })))

    const result = await OfferingImportsClient.getImport("imp-2")

    expect(result.id).toBe("imp-2")
    expect(result.validRows).toHaveLength(2)
  })

  it("confirmImport PATCHes with { status: 'confirmed' } and returns the commit summary", async () => {
    const capture: { body?: Record<string, unknown>; id?: string } = {}
    server.use(confirmImportSuccess(capture))

    const result = await OfferingImportsClient.confirmImport("imp-1")

    expect(capture.id).toBe("imp-1")
    expect(capture.body).toEqual({ status: "confirmed" })
    expect(result.status).toBe("confirmed")
    expect(result.importedCount).toBe(2)
  })
})
