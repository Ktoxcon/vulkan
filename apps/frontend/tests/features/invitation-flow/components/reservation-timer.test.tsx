import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ReservationTimer } from "@/features/invitation-flow/components/reservation-timer.component"

describe("ReservationTimer", () => {
  it("renders the remaining hold time as mm:ss", () => {
    render(
      <ReservationTimer
        expiresAt={new Date(Date.now() + 5 * 60 * 1000).toISOString()}
        onReReserve={() => {}}
        isReReserving={false}
      />,
    )

    expect(screen.getByText(/seat held for/i)).toBeInTheDocument()
    expect(screen.getByText(/\d:\d\d/)).toBeInTheDocument()
  })

  it("shows the re-reserve prompt when already expired and calls onReReserve", async () => {
    const onReReserve = vi.fn()
    render(
      <ReservationTimer
        expiresAt={new Date(Date.now() - 1000).toISOString()}
        onReReserve={onReReserve}
        isReReserving={false}
      />,
    )

    expect(screen.getByText(/your seat hold expired/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /reserve again/i }))
    expect(onReReserve).toHaveBeenCalledOnce()
  })

  it("ticks down to the expired prompt once the deadline passes", async () => {
    render(
      <ReservationTimer
        expiresAt={new Date(Date.now() + 1100).toISOString()}
        onReReserve={() => {}}
        isReReserving={false}
      />,
    )

    expect(screen.getByText(/seat held for/i)).toBeInTheDocument()
    await waitFor(
      () => expect(screen.getByText(/your seat hold expired/i)).toBeInTheDocument(),
      { timeout: 3000 },
    )
  })

  it("renders nothing-but-prompt when expiresAt is null", () => {
    render(
      <ReservationTimer expiresAt={null} onReReserve={() => {}} isReReserving={false} />,
    )

    expect(screen.getByText(/your seat hold expired/i)).toBeInTheDocument()
  })
})
