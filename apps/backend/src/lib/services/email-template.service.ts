import { AppConfig } from "@vulkan/config/app.config";
import {
  EmailTemplateAlreadyExistsError,
  EmailTemplateLockedError,
  EmailTemplateNotFoundError,
} from "@vulkan/errors/email-template.errors";
import { EventStatus } from "@vulkan/lib/constants/event-status";
import type { EmailTemplate } from "@vulkan/lib/db/schema/email-templates.types";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import { EmailTransport } from "@vulkan/lib/email/transport";
import type { TemplateVariables } from "@vulkan/lib/email/transport.types";
import { EmailTemplatesRepository } from "@vulkan/lib/repositories/email-templates.repo";
import {
  EmailTemplateInvitationPathPrefix,
  EmailTemplatePreviewSample,
} from "@vulkan/lib/services/email-template.service.constants";
import type { EmailTemplatePreview } from "@vulkan/lib/services/email-template.service.types";
import type {
  CreateEmailTemplateBody,
  UpdateEmailTemplateBody,
} from "@vulkan/lib/validators/email-template.schemas.types";

export const EmailTemplateService = {
  assertDraft(event: SalesEvent): void {
    if (event.status !== EventStatus.DRAFT) {
      throw new EmailTemplateLockedError();
    }
  },

  buildPreviewVariables(event: SalesEvent): TemplateVariables {
    return {
      clientName: EmailTemplatePreviewSample.clientName,
      companyName: EmailTemplatePreviewSample.companyName,
      eventName: event.name,
      eventDate: event.eventStartDate.toISOString(),
      invitationUrl: `${AppConfig.appUrl}${EmailTemplateInvitationPathPrefix}/${EmailTemplatePreviewSample.invitationToken}`,
    };
  },

  async create(
    event: SalesEvent,
    actorId: string,
    body: CreateEmailTemplateBody,
  ): Promise<EmailTemplate> {
    EmailTemplateService.assertDraft(event);

    const existing = await EmailTemplatesRepository.findByEventId(event.id);
    if (existing) {
      throw new EmailTemplateAlreadyExistsError();
    }

    return EmailTemplatesRepository.insert({
      eventId: event.id,
      name: body.name,
      subject: body.subject,
      htmlBody: body.htmlBody,
      textBody: body.textBody,
      createdBy: actorId,
    });
  },

  async get(eventId: string): Promise<EmailTemplate> {
    const template = await EmailTemplatesRepository.findByEventId(eventId);
    if (!template) {
      throw new EmailTemplateNotFoundError();
    }
    return template;
  },

  async update(
    event: SalesEvent,
    body: UpdateEmailTemplateBody,
  ): Promise<EmailTemplate> {
    EmailTemplateService.assertDraft(event);

    const current = await EmailTemplatesRepository.findByEventId(event.id);
    if (!current) {
      throw new EmailTemplateNotFoundError();
    }

    return EmailTemplatesRepository.update(event.id, {
      name: body.name ?? current.name,
      subject: body.subject ?? current.subject,
      htmlBody: body.htmlBody ?? current.htmlBody,
      textBody: body.textBody ?? current.textBody,
    });
  },

  async preview(event: SalesEvent): Promise<EmailTemplatePreview> {
    const template = await EmailTemplateService.get(event.id);
    const variables = EmailTemplateService.buildPreviewVariables(event);

    return {
      subject: EmailTransport.renderTemplate(template.subject, variables),
      htmlBody: EmailTransport.renderTemplate(template.htmlBody, variables),
      textBody: EmailTransport.renderTemplate(template.textBody, variables),
      variables,
    };
  },
};
