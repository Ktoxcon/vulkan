import { InvitationsRosterMissingError } from "@vulkan/errors/invitation.errors";
import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { db } from "@vulkan/lib/db/index";
import { draftConfirmations } from "@vulkan/lib/db/schema/draft-confirmations";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import { RostersRepository } from "@vulkan/lib/repositories/rosters.repo";
import { EligibilityService } from "@vulkan/lib/services/eligibility.service";
import { EligibilityReason } from "@vulkan/lib/services/eligibility.service.constants";
import {
  InvitationReportColumns,
  InvitationTokenByteLength,
  MillisecondsPerDay,
  TrackingPixelContentType,
  TrackingPixelGif,
} from "@vulkan/lib/services/invitations.service.constants";
import type {
  GenerateInvitationsResult,
  InvitationListView,
  InvitationMonitoring,
  OpenTrackingResult,
  TokenResolutionEvent,
  TokenResolutionView,
} from "@vulkan/lib/services/invitations.service.types";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";

export const InvitationsService = {
  generateToken(): string {
    return randomBytes(InvitationTokenByteLength).toString("base64url");
  },

  async generate(event: SalesEvent): Promise<GenerateInvitationsResult> {
    const roster = await RostersRepository.findByEventId(event.id);
    if (!roster) {
      throw new InvitationsRosterMissingError();
    }

    const members = await RostersRepository.listRosterClients(roster.id);
    if (members.length === 0) {
      throw new InvitationsRosterMissingError();
    }

    const existingRosterClientIds = new Set(
      await InvitationsRepository.findRosterClientIdsWithInvitation(event.id),
    );

    const pending = members
      .filter((member) => !existingRosterClientIds.has(member.rosterClientId))
      .map((member) => ({
        rosterClientId: member.rosterClientId,
        token: InvitationsService.generateToken(),
      }));

    const created = await InvitationsRepository.createMany(
      event.id,
      pending,
      InvitationStatus.PENDING,
    );

    return {
      created,
      createdCount: created.length,
      totalRosterClients: members.length,
      alreadyExistingCount: existingRosterClientIds.size,
    };
  },

  async buildMonitoring(eventId: string): Promise<InvitationMonitoring> {
    const counts = await InvitationsRepository.countByStatus(eventId);
    const byStatus = new Map(counts.map((row) => [row.status, row.total]));
    const at = (status: string): number => byStatus.get(status) ?? 0;

    return {
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

  async list(eventId: string, statuses: string[]): Promise<InvitationListView> {
    const rows = await InvitationsRepository.listByEvent(eventId, statuses);
    const monitoring = await InvitationsService.buildMonitoring(eventId);

    return {
      invitations: rows.map((row) => ({
        invitation: row.invitation,
        client: row.client,
      })),
      monitoring,
    };
  },

  async report(eventId: string): Promise<string> {
    const rows = await InvitationsRepository.listByEvent(eventId, []);

    const header = InvitationReportColumns.join(",");
    const lines = rows.map((row) =>
      [
        row.client.email,
        row.invitation.status,
        InvitationsService.formatTimestamp(row.invitation.sentAt),
        InvitationsService.formatTimestamp(row.invitation.openedAt),
        InvitationsService.formatTimestamp(row.invitation.confirmedAt),
      ]
        .map((value) => InvitationsService.escapeCsv(value))
        .join(","),
    );

    return [header, ...lines].join("\n");
  },

  formatTimestamp(value: Date | null): string {
    return value === null ? "" : value.toISOString();
  },

  escapeCsv(value: string): string {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  },

  async resolveToken(token: string): Promise<TokenResolutionView> {
    const resolution = await InvitationsRepository.findByToken(token);
    const now = new Date();

    const eligibility = await EligibilityService.evaluate(resolution, now);

    if (!resolution) {
      throw EligibilityService.toError(
        eligibility.eligible
          ? EligibilityReason.INVALID_TOKEN
          : eligibility.reason,
      );
    }

    const { event, client, invitation } = resolution;
    const hasDraft = await InvitationsService.draftExists(invitation.id);

    return {
      event: InvitationsService.buildEventContext(event),
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        company: client.company,
      },
      confirmation: {
        confirmed: invitation.confirmedAt !== null,
        confirmedAt: invitation.confirmedAt,
      },
      hasDraft,
      eligible: eligibility.eligible,
      reason: eligibility.reason,
    };
  },

  buildEventContext(event: SalesEvent): TokenResolutionEvent {
    const isMultiDay =
      event.eventEndDate !== null &&
      event.eventEndDate.getTime() > event.eventStartDate.getTime();

    return {
      id: event.id,
      name: event.name,
      status: event.status,
      eventStartDate: event.eventStartDate,
      eventEndDate: event.eventEndDate,
      registrationStartDate: event.registrationStartDate,
      registrationEndDate: event.registrationEndDate,
      capacity: event.capacity,
      isMultiDay,
      availableAttendanceDates: InvitationsService.buildAttendanceDates(
        event.eventStartDate,
        isMultiDay ? event.eventEndDate : null,
      ),
    };
  },

  buildAttendanceDates(start: Date, end: Date | null): Date[] {
    if (end === null) {
      return [start];
    }
    const dates: Date[] = [];
    for (
      let time = start.getTime();
      time <= end.getTime();
      time += MillisecondsPerDay
    ) {
      dates.push(new Date(time));
    }
    return dates;
  },

  async draftExists(invitationId: string): Promise<boolean> {
    const [row] = await db
      .select({ id: draftConfirmations.id })
      .from(draftConfirmations)
      .where(eq(draftConfirmations.invitationId, invitationId))
      .limit(1);
    return row !== undefined;
  },

  async trackOpen(token: string): Promise<OpenTrackingResult> {
    const resolution = await InvitationsRepository.findByToken(token);

    if (resolution && resolution.invitation.openedAt === null) {
      await InvitationsRepository.markOpened(
        resolution.invitation.id,
        InvitationStatus.OPENED,
        new Date(),
      );
    }

    return { contentType: TrackingPixelContentType, body: TrackingPixelGif };
  },
};
