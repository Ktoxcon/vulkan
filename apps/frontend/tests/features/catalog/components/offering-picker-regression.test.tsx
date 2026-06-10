import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { OfferingPicker } from "@/features/events/components/offering-picker.component"
import { server } from "../../../msw/server"
import { listOfferingsPaged, makeOffering } from "../../../msw/offerings.handlers"
import { createTestQueryClient } from "../../../helpers/render"
import { installRadixJsdomShims } from "../../../helpers/radix"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

installRadixJsdomShims()

function renderPicker() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <OfferingPicker
        eventId="e-1"
        assignedIds={[]}
        open
        onOpenChange={() => {}}
      />
    </QueryClientProvider>,
  )
}

describe("OfferingPicker consumes the relocated catalog Offering type", () => {
  it("renders active catalog offerings (string basePrice) without breaking", async () => {
    server.use(
      listOfferingsPaged([
        makeOffering({
          id: "o-1",
          name: "Drakescale Plate",
          basePrice: "1200.00",
          isActive: true,
        }),
      ]),
    )
    renderPicker()

    expect(await screen.findByText("Drakescale Plate")).toBeInTheDocument()
    expect(screen.getByText(/Q1,200\.00/)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /assign/i }),
    ).toBeInTheDocument()
  })
})
