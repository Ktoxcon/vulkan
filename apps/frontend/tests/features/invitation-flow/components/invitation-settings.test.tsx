import { afterEach, describe, expect, it } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import i18n from "@/lib/i18n/i18n"
import { InvitationSettings } from "@/features/invitation-flow/components/invitation-settings.component"
import { installRadixJsdomShims } from "../../../helpers/radix"

installRadixJsdomShims()

afterEach(async () => {
  await i18n.changeLanguage("en")
})

describe("InvitationSettings", () => {
  it("renders a gear button with an accessible name", async () => {
    await i18n.changeLanguage("en")
    render(<InvitationSettings />)

    expect(
      screen.getByRole("button", { name: /^settings$/i }),
    ).toBeInTheDocument()
  })

  it("does not reveal the language control initially and hovering does not open it", async () => {
    await i18n.changeLanguage("en")
    const user = userEvent.setup()
    render(<InvitationSettings />)

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()

    await user.hover(screen.getByRole("button", { name: /^settings$/i }))

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("reveals the language selector on click", async () => {
    await i18n.changeLanguage("en")
    const user = userEvent.setup()
    render(<InvitationSettings />)

    await user.click(screen.getByRole("button", { name: /^settings$/i }))

    expect(await screen.findByRole("combobox")).toBeInTheDocument()
  })

  it("closes the menu when the trigger is clicked again", async () => {
    await i18n.changeLanguage("en")
    const user = userEvent.setup()
    render(<InvitationSettings />)

    const trigger = screen.getByRole("button", { name: /^settings$/i })
    await user.click(trigger)
    expect(await screen.findByRole("combobox")).toBeInTheDocument()

    await user.click(trigger)
    await waitFor(() => {
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    })
  })

  it("closes on Escape and returns focus to the trigger", async () => {
    await i18n.changeLanguage("en")
    const user = userEvent.setup()
    render(<InvitationSettings />)

    const trigger = screen.getByRole("button", { name: /^settings$/i })
    await user.click(trigger)
    expect(await screen.findByRole("combobox")).toBeInTheDocument()

    await user.keyboard("{Escape}")

    await waitFor(() => {
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    })
    expect(trigger).toHaveFocus()
  })
})
