import { describe, expect, it } from "vitest"
import { formatPrice } from "@/lib/formatters/price.formatter"

describe("formatPrice", () => {
  it("formats a numeric string in quetzales", () => {
    expect(formatPrice("1234.5")).toBe("Q1,234.50")
  })

  it("formats a number in quetzales", () => {
    expect(formatPrice(1234.5)).toBe("Q1,234.50")
  })

  it("returns the raw value unchanged when it is not a number", () => {
    expect(formatPrice("abc")).toBe("abc")
  })
})
