import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import { InvitationEventContext } from "@/features/invitation-flow/components/invitation-event-context.component"
import {
  formatCountdown,
  remainingMsUntil,
} from "@/features/invitation-flow/lib/countdown"
import {
  MS_PER_DAY,
  MS_PER_HOUR,
  MS_PER_MINUTE,
  MS_PER_SECOND,
} from "@/features/invitation-flow/constants/countdown.constants"
import { makeEvent } from "../../../msw/invitation-flow.handlers"

const NOW = new Date("2026-06-09T12:00:00.000Z").getTime()

describe("invitation event context countdown", () => {
  describe("formatCountdown (pure helper)", () => {
    it("formats a multi-day remainder as zero-padded dd:hh:mm:ss", () => {
      const remaining =
        5 * MS_PER_DAY + 14 * MS_PER_HOUR + 32 * MS_PER_MINUTE + 8 * MS_PER_SECOND
      expect(formatCountdown(remaining)).toBe("05:14:32:08")
    })

    it("zero-pads the days segment when under one day", () => {
      const remaining =
        3 * MS_PER_HOUR + 7 * MS_PER_MINUTE + 9 * MS_PER_SECOND
      expect(formatCountdown(remaining)).toBe("00:03:07:09")
    })

    it("never produces negative segments at or past zero", () => {
      expect(formatCountdown(0)).toBe("00:00:00:00")
      expect(formatCountdown(-50_000)).toBe("00:00:00:00")
    })
  })

  describe("remainingMsUntil (pure helper)", () => {
    it("clamps to zero once the start time has passed", () => {
      const start = new Date(NOW - MS_PER_MINUTE).toISOString()
      expect(remainingMsUntil(start, NOW)).toBe(0)
    })

    it("computes the positive remainder for a future start", () => {
      const start = new Date(NOW + 2 * MS_PER_HOUR).toISOString()
      expect(remainingMsUntil(start, NOW)).toBe(2 * MS_PER_HOUR)
    })
  })

  describe("InvitationEventContext component", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(NOW)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("renders a future event name and a positive dd:hh:mm:ss countdown", () => {
      const start = new Date(
        NOW +
          5 * MS_PER_DAY +
          14 * MS_PER_HOUR +
          32 * MS_PER_MINUTE +
          8 * MS_PER_SECOND,
      ).toISOString()
      render(
        <InvitationEventContext
          event={makeEvent({ name: "Nocturne Forge Summit", eventStartDate: start })}
        />,
      )

      expect(screen.getByText("Nocturne Forge Summit")).toBeInTheDocument()
      const countdown = screen.getByLabelText(/time until the event starts/i)
      expect(countdown).toHaveTextContent("05:14:32:08")
    })

    it("shows days as 00 when the event starts within one day", () => {
      const start = new Date(
        NOW + 3 * MS_PER_HOUR + 7 * MS_PER_MINUTE + 9 * MS_PER_SECOND,
      ).toISOString()
      render(
        <InvitationEventContext event={makeEvent({ eventStartDate: start })} />,
      )

      const countdown = screen.getByLabelText(/time until the event starts/i)
      expect(countdown).toHaveTextContent("00:03:07:09")
    })

    it("shows the started message and no countdown once the event has started", () => {
      const start = new Date(NOW - MS_PER_MINUTE).toISOString()
      render(
        <InvitationEventContext event={makeEvent({ eventStartDate: start })} />,
      )

      expect(screen.getByText("Event started")).toBeInTheDocument()
      expect(
        screen.queryByLabelText(/time until the event starts/i),
      ).not.toBeInTheDocument()
    })

    it("ticks the countdown down without going negative", () => {
      const start = new Date(NOW + 2 * MS_PER_SECOND).toISOString()
      render(
        <InvitationEventContext event={makeEvent({ eventStartDate: start })} />,
      )

      expect(
        screen.getByLabelText(/time until the event starts/i),
      ).toHaveTextContent("00:00:00:02")

      act(() => {
        vi.advanceTimersByTime(2 * MS_PER_SECOND)
      })

      expect(screen.getByText("Event started")).toBeInTheDocument()
    })
  })
})
