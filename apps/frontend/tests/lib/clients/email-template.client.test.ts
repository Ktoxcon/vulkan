import { describe, expect, it } from "vitest"
import { EmailTemplateClient } from "@/lib/clients/email-template.client"
import { ApiError } from "@/lib/errors/api.error"
import { server } from "../../msw/server"
import {
  createEmailTemplate,
  createEmailTemplateError,
  getEmailTemplate,
  getEmailTemplateNotFound,
  getEmailTemplatePreview,
  makeEmailTemplate,
  makeEmailTemplatePreview,
  updateEmailTemplate,
} from "../../msw/email-template.handlers"

const input = {
  name: "Forge Invite",
  subject: "Subject",
  htmlBody: "<p>Body</p>",
  textBody: "Body",
}

describe("EmailTemplateClient", () => {
  it("gets the current template", async () => {
    server.use(getEmailTemplate(makeEmailTemplate({ name: "Forge Invite" })))

    const template = await EmailTemplateClient.get("e-1")

    expect(template.name).toBe("Forge Invite")
  })

  it("throws a 404 ApiError when no template exists", async () => {
    server.use(getEmailTemplateNotFound())

    const error = await EmailTemplateClient.get("e-1").catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe("EMAIL_TEMPLATE_NOT_FOUND")
    expect(error.status).toBe(404)
  })

  it("creates a template with the form body", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(createEmailTemplate(capture))

    await EmailTemplateClient.create("e-1", input)

    expect(capture.body).toEqual(input)
  })

  it("surfaces EMAIL_TEMPLATE_ALREADY_EXISTS on create", async () => {
    server.use(createEmailTemplateError())

    const error = await EmailTemplateClient.create("e-1", input).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe("EMAIL_TEMPLATE_ALREADY_EXISTS")
  })

  it("updates a template in place", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(updateEmailTemplate(capture))

    const updated = await EmailTemplateClient.update("e-1", {
      ...input,
      subject: "New subject",
    })

    expect(capture.body?.subject).toBe("New subject")
    expect(updated.subject).toBe("New subject")
  })

  it("fetches the rendered preview", async () => {
    server.use(
      getEmailTemplatePreview(
        makeEmailTemplatePreview({ subject: "You are invited, Raphen" }),
      ),
    )

    const preview = await EmailTemplateClient.preview("e-1")

    expect(preview.subject).toBe("You are invited, Raphen")
    expect(preview.variables.clientName).toBe("Raphen")
  })
})
