import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { EmailTemplateTab } from "@/features/email-templates/components/email-template-tab.component"
import type { EventStatus } from "@/features/events/types/event.types"
import { server } from "../../../msw/server"
import {
  createEmailTemplate,
  createEmailTemplateError,
  getEmailTemplate,
  getEmailTemplateNotFound,
  getEmailTemplatePreview,
  makeEmailTemplate,
  makeEmailTemplatePreview,
  updateEmailTemplate,
} from "../../../msw/email-template.handlers"
import { getReadiness, makeReadiness } from "../../../msw/events.handlers"
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

function renderTab(status: EventStatus = "draft", client?: QueryClient) {
  return render(
    <QueryClientProvider client={client ?? createTestQueryClient()}>
      <EmailTemplateTab eventId="e-1" eventStatus={status} />
    </QueryClientProvider>,
  )
}

describe("EmailTemplateTab", () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
  })

  it("creates a template from an empty state and toasts", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(
      getEmailTemplateNotFound(),
      createEmailTemplate(capture),
      getEmailTemplatePreview(),
      getReadiness(makeReadiness()),
    )
    const user = userEvent.setup()
    renderTab("draft")

    const nameInput = await screen.findByLabelText(/^name$/i)
    await user.type(nameInput, "Forge Invite")
    await user.type(screen.getByLabelText(/^subject$/i), "Hi {{clientName}}")
    await user.type(screen.getByLabelText(/html body/i), "<p>Hello</p>")
    await user.type(screen.getByLabelText(/text body/i), "Hello")
    await user.click(screen.getByRole("button", { name: /create template/i }))

    await waitFor(() => expect(capture.body?.name).toBe("Forge Invite"))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
  })

  it("edits an existing template in place (Save changes) and renders the preview", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(
      getEmailTemplate(makeEmailTemplate({ subject: "Old subject" })),
      updateEmailTemplate(capture),
      getEmailTemplatePreview(
        makeEmailTemplatePreview({ subject: "You are invited, Raphen" }),
      ),
      getReadiness(makeReadiness()),
    )
    const user = userEvent.setup()
    renderTab("draft")

    expect(
      await screen.findByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument()
    expect(await screen.findByText("You are invited, Raphen")).toBeInTheDocument()

    const subject = screen.getByLabelText(/^subject$/i)
    await user.clear(subject)
    await user.type(subject, "New subject")
    await user.click(screen.getByRole("button", { name: /save changes/i }))

    await waitFor(() => expect(capture.body?.subject).toBe("New subject"))
  })

  it("disables the form with a lock hint when the event is not Draft", async () => {
    server.use(
      getEmailTemplate(makeEmailTemplate()),
      getEmailTemplatePreview(),
    )
    renderTab("active")

    const name = await screen.findByLabelText(/^name$/i)
    expect(name).toBeDisabled()
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled()
    expect(
      screen.getByText(/the email template is locked once the event leaves draft/i),
    ).toBeInTheDocument()
  })

  it("surfaces EMAIL_TEMPLATE_ALREADY_EXISTS as a toast", async () => {
    server.use(getEmailTemplateNotFound(), createEmailTemplateError())
    const user = userEvent.setup()
    renderTab("draft")

    await user.type(await screen.findByLabelText(/^name$/i), "Forge")
    await user.type(screen.getByLabelText(/^subject$/i), "Subject")
    await user.type(screen.getByLabelText(/html body/i), "<p>x</p>")
    await user.type(screen.getByLabelText(/text body/i), "x")
    await user.click(screen.getByRole("button", { name: /create template/i }))

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        expect.stringMatching(/template already exists/i),
      ),
    )
  })
})
