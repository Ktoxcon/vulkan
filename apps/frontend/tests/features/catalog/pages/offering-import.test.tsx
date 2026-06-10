import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { OfferingImportPage } from "@/features/catalog/pages/offering-import.page"
import { server } from "../../../msw/server"
import {
  confirmImportSuccess,
  createImportSuccess,
  makeImportRecord,
} from "../../../msw/offering-imports.handlers"
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

function renderImport() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={["/catalog/import"]}>
        <OfferingImportPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function csvFile(name = "catalog.csv") {
  return new File(["name,type,description,basePrice\n"], name, {
    type: "text/csv",
  })
}

describe("OfferingImportPage", () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
  })

  it("uploads a CSV, previews counts and invalid/duplicate rows, confirms, then shows a summary", async () => {
    const confirmCapture: { body?: Record<string, unknown>; id?: string } = {}
    server.use(
      createImportSuccess(undefined, makeImportRecord({ id: "imp-1" })),
      confirmImportSuccess(
        confirmCapture,
        makeImportRecord({
          id: "imp-1",
          status: "confirmed",
          importedCount: 2,
          duplicateCount: 1,
          invalidCount: 1,
          invalidRows: [],
          duplicateRows: [],
        }),
      ),
    )
    const user = userEvent.setup()
    renderImport()

    await user.upload(
      document.querySelector("input[type=file]") as HTMLInputElement,
      csvFile("upload.csv"),
    )
    await user.click(screen.getByRole("button", { name: /upload and preview/i }))

    expect(await screen.findByText(/import preview/i)).toBeInTheDocument()
    expect(screen.getByText("Invalid rows")).toBeInTheDocument()
    expect(screen.getByText(/type must be product or service/i)).toBeInTheDocument()
    expect(screen.getByText(/weapon/i)).toBeInTheDocument()
    expect(screen.getByText("Duplicate rows")).toBeInTheDocument()
    expect(screen.getByText("Drakescale Plate")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /confirm import/i }))

    expect(await screen.findByText(/import complete/i)).toBeInTheDocument()
    expect(confirmCapture.id).toBe("imp-1")
    expect(confirmCapture.body).toEqual({ status: "confirmed" })
    expect(toastSuccess).toHaveBeenCalledWith("2 offerings imported")
  })

  it("disables confirm when the preview has nothing to import", async () => {
    server.use(
      createImportSuccess(
        undefined,
        makeImportRecord({
          id: "imp-2",
          importedCount: 0,
          validRows: [],
          duplicateRows: [],
          invalidRows: [],
        }),
      ),
    )
    const user = userEvent.setup()
    renderImport()

    await user.upload(
      document.querySelector("input[type=file]") as HTMLInputElement,
      csvFile(),
    )
    await user.click(screen.getByRole("button", { name: /upload and preview/i }))

    expect(await screen.findByText(/import preview/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /confirm import/i })).toBeDisabled()
  })

  it("cancels the preview and returns to the upload step", async () => {
    server.use(createImportSuccess())
    const user = userEvent.setup()
    renderImport()

    await user.upload(
      document.querySelector("input[type=file]") as HTMLInputElement,
      csvFile(),
    )
    await user.click(screen.getByRole("button", { name: /upload and preview/i }))

    expect(await screen.findByText(/import preview/i)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /cancel/i }))

    expect(await screen.findByText(/upload catalog csv/i)).toBeInTheDocument()
  })
})
