import { describe, expect, it } from "vitest"
import { formatDate } from "@/lib/formatters/date.formatter"

describe("formatDate", () => {
  it("formats a valid ISO datetime via toLocaleString", () => {
    const value = "2026-06-08T12:00:00.000Z"
    expect(formatDate(value)).toBe(new Date(value).toLocaleString())
  })

  it("returns the raw value when the date is invalid", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date")
  })

  it("returns an em dash when no value is provided", () => {
    expect(formatDate()).toBe("—")
    expect(formatDate("")).toBe("—")
  })
})
