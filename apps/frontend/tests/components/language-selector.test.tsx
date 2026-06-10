import { afterEach, describe, expect, it } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import i18n from "@/lib/i18n/i18n"
import { LanguageSelector } from "@/components/language-selector.component"
import { installRadixJsdomShims } from "../helpers/radix"

installRadixJsdomShims()

afterEach(async () => {
  await i18n.changeLanguage("en")
})

describe("LanguageSelector", () => {
  it("reflects the active language in the trigger", async () => {
    await i18n.changeLanguage("en")
    render(<LanguageSelector />)

    expect(
      screen.getByRole("combobox", { name: /language/i }),
    ).toHaveTextContent("English")
  })

  it("changes the visible language label when a new option is picked, without a reload", async () => {
    await i18n.changeLanguage("en")
    const user = userEvent.setup()
    render(<LanguageSelector />)

    const trigger = screen.getByRole("combobox", { name: /language/i })
    expect(trigger).toHaveTextContent("English")

    await user.click(trigger)
    await user.click(screen.getByRole("option", { name: "Español" }))

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: /idioma/i }),
      ).toHaveTextContent("Español")
    })
    expect(i18n.language).toBe("es")
  })

  it("persists the selected language to localStorage", async () => {
    await i18n.changeLanguage("en")
    const user = userEvent.setup()
    render(<LanguageSelector />)

    await user.click(screen.getByRole("combobox", { name: /language/i }))
    await user.click(screen.getByRole("option", { name: "Español" }))

    await waitFor(() => {
      expect(localStorage.getItem("i18nextLng")).toBe("es")
    })
  })
})
