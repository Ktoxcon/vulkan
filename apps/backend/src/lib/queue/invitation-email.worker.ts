import { AppConfig } from "@vulkan/config/app.config";
import {
  DispatchInvitationNotFoundError,
  DispatchTemplateNotFoundError,
} from "@vulkan/errors/dispatch.errors";
import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { EmailTransport } from "@vulkan/lib/email/transport";
import type { TemplateVariables } from "@vulkan/lib/email/transport.types";
import { getQueueConnection } from "@vulkan/lib/queue/connection";
import {
  InvitationUrlPathPrefix,
  TrackingPixelPathPrefix,
  TrackingPixelPathSuffix,
} from "@vulkan/lib/queue/invitation-email.worker.constants";
import type { InvitationEmailJobData } from "@vulkan/lib/queue/invitation-email.queue.types";
import {
  InvitationEmailConcurrency,
  InvitationEmailQueueName,
} from "@vulkan/lib/queue/queues.constants";
import { EmailTemplatesRepository } from "@vulkan/lib/repositories/email-templates.repo";
import type { DispatchInvitationContext } from "@vulkan/lib/repositories/invitation-dispatch.repo.types";
import { InvitationDispatchRepository } from "@vulkan/lib/repositories/invitation-dispatch.repo";
import { Worker } from "bullmq";
import type { Job } from "bullmq";

export const InvitationEmailWorker = {
  create(): Worker<InvitationEmailJobData> {
    return new Worker<InvitationEmailJobData>(
      InvitationEmailQueueName,
      InvitationEmailWorker.process,
      {
        connection: getQueueConnection(),
        concurrency: InvitationEmailConcurrency,
      },
    );
  },

  async process(job: Job<InvitationEmailJobData>): Promise<void> {
    const context = await InvitationDispatchRepository.findContextById(
      job.data.invitationId,
    );
    if (!context) {
      throw new DispatchInvitationNotFoundError();
    }

    const template = await EmailTemplatesRepository.findByEventId(
      context.event.id,
    );
    if (!template) {
      throw new DispatchTemplateNotFoundError();
    }

    await InvitationDispatchRepository.markProcessing(
      context.invitation.id,
      InvitationStatus.PROCESSING,
    );

    try {
      const variables = InvitationEmailWorker.buildVariables(context);
      await EmailTransport.getTransporter().sendMail({
        from: AppConfig.smtp.from,
        to: context.client.email,
        subject: EmailTransport.renderTemplate(template.subject, variables),
        html: InvitationEmailWorker.withTrackingPixel(
          EmailTransport.renderTemplate(template.htmlBody, variables),
          context.invitation.token,
        ),
        text: EmailTransport.renderTemplate(template.textBody, variables),
      });

      await InvitationDispatchRepository.markSent(
        context.invitation.id,
        InvitationStatus.SENT,
        new Date(),
      );
    } catch (error) {
      await InvitationDispatchRepository.markFailed(
        context.invitation.id,
        InvitationStatus.FAILED,
      );
      throw error;
    }
  },

  buildVariables(context: DispatchInvitationContext): TemplateVariables {
    return {
      clientName: context.client.name,
      companyName: context.client.company ?? "",
      eventName: context.event.name,
      eventDate: context.event.eventStartDate.toISOString(),
      invitationUrl: InvitationEmailWorker.invitationUrl(
        context.invitation.token,
      ),
    };
  },

  invitationUrl(token: string): string {
    return `${AppConfig.appUrl}${InvitationUrlPathPrefix}/${token}`;
  },

  pixelUrl(token: string): string {
    return `${AppConfig.appUrl}${TrackingPixelPathPrefix}/${token}${TrackingPixelPathSuffix}`;
  },

  withTrackingPixel(htmlBody: string, token: string): string {
    const pixel = `<img src="${InvitationEmailWorker.pixelUrl(token)}" width="1" height="1" alt="" style="display:none" />`;
    return `${htmlBody}${pixel}`;
  },
};
