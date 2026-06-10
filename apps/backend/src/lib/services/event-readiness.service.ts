import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import { EmailTemplatesRepository } from "@vulkan/lib/repositories/email-templates.repo";
import { EventOfferingsRepository } from "@vulkan/lib/repositories/event-offerings.repo";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import { RosterClientsRepository } from "@vulkan/lib/repositories/roster-clients.repo";
import { RostersRepository } from "@vulkan/lib/repositories/rosters.repo";
import type {
  ReadinessChecks,
  ReadinessReport,
} from "@vulkan/lib/services/event-readiness.service.types";

export const EventReadinessService = {
  async evaluate(event: SalesEvent): Promise<ReadinessReport> {
    const [roster, tokensReady, emailTemplate, offeringCount] =
      await Promise.all([
        RostersRepository.findByEventId(event.id),
        InvitationsRepository.tokensReady(event.id),
        EmailTemplatesRepository.findByEventId(event.id),
        EventOfferingsRepository.countAssigned(event.id),
      ]);

    const rosterExists = roster !== undefined;
    const validClientCount = roster
      ? await RosterClientsRepository.countByRosterId(roster.id)
      : 0;
    const hasTemplate = emailTemplate !== undefined;

    const { registrationStartDate, registrationEndDate, eventStartDate } =
      event;

    const registrationDatesValid =
      registrationStartDate instanceof Date &&
      registrationEndDate instanceof Date &&
      eventStartDate instanceof Date &&
      !Number.isNaN(registrationStartDate.getTime()) &&
      !Number.isNaN(registrationEndDate.getTime()) &&
      !Number.isNaN(eventStartDate.getTime()) &&
      registrationStartDate < registrationEndDate &&
      registrationEndDate <= eventStartDate;

    const checks: ReadinessChecks = {
      detailsConfigured:
        typeof event.name === "string" &&
        event.name.trim().length > 0 &&
        event.eventStartDate instanceof Date &&
        !Number.isNaN(event.eventStartDate.getTime()),
      capacityConfigured:
        Number.isInteger(event.capacity) && event.capacity > 0,
      offeringsAssigned: offeringCount > 0,
      rosterUploaded: rosterExists,
      rosterHasValidClient: rosterExists && validClientCount > 0,
      inviteTokensReady: tokensReady,
      emailTemplateConfigured: hasTemplate,
      registrationDatesValid,
    };

    const ready = Object.values(checks).every(Boolean);

    return { ready, checks };
  },
};
