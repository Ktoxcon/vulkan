import {
  DispatchNoPendingInvitationsError,
  DispatchTemplateMissingError,
} from "@vulkan/errors/dispatch.errors";
import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import { getInvitationEmailQueue } from "@vulkan/lib/queue/invitation-email.queue";
import { InvitationEmailBatchSize } from "@vulkan/lib/queue/queues.constants";
import { EmailTemplatesRepository } from "@vulkan/lib/repositories/email-templates.repo";
import { InvitationDispatchRepository } from "@vulkan/lib/repositories/invitation-dispatch.repo";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import type {
  DispatchProgress,
  DispatchResult,
} from "@vulkan/lib/services/invitation-dispatch.service.types";

export const InvitationDispatchService = {
  async dispatch(event: SalesEvent): Promise<DispatchResult> {
    const template = await EmailTemplatesRepository.findByEventId(event.id);
    if (!template) {
      throw new DispatchTemplateMissingError();
    }

    const pendingIds = await InvitationDispatchRepository.listIdsByStatus(
      event.id,
      InvitationStatus.PENDING,
    );
    if (pendingIds.length === 0) {
      throw new DispatchNoPendingInvitationsError();
    }

    await InvitationDispatchService.enqueue(event.id, pendingIds);

    const queuedCount = await InvitationDispatchRepository.markQueued(
      pendingIds,
      InvitationStatus.QUEUED,
    );

    const progress = await InvitationDispatchService.getProgress(event.id);

    return {
      dispatchId: event.id,
      eventId: event.id,
      queuedCount,
      totalInvitations: progress.total,
      progress,
    };
  },

  async enqueue(eventId: string, invitationIds: string[]): Promise<void> {
    const queue = getInvitationEmailQueue();
    for (
      let offset = 0;
      offset < invitationIds.length;
      offset += InvitationEmailBatchSize
    ) {
      const batch = invitationIds.slice(
        offset,
        offset + InvitationEmailBatchSize,
      );
      await queue.addBulk(
        batch.map((invitationId) => ({
          name: invitationId,
          data: { invitationId, eventId },
        })),
      );
    }
  },

  async getProgress(eventId: string): Promise<DispatchProgress> {
    const counts = await InvitationsRepository.countByStatus(eventId);
    const byStatus = new Map(counts.map((row) => [row.status, row.total]));
    const at = (status: string): number => byStatus.get(status) ?? 0;

    return {
      dispatchId: eventId,
      eventId,
      total: counts.reduce((sum, row) => sum + row.total, 0),
      pending: at(InvitationStatus.PENDING),
      queued: at(InvitationStatus.QUEUED),
      processing: at(InvitationStatus.PROCESSING),
      sent: at(InvitationStatus.SENT),
      opened: at(InvitationStatus.OPENED),
      failed: at(InvitationStatus.FAILED),
      confirmed: at(InvitationStatus.CONFIRMED),
    };
  },
};
