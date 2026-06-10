import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import { CapacityRepository } from "@vulkan/lib/repositories/capacity.repo";
import { ClientInterestsRepository } from "@vulkan/lib/repositories/client-interests.repo";
import { EventOfferingsRepository } from "@vulkan/lib/repositories/event-offerings.repo";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import type {
  EventMetrics,
  EventMetricsServiceType,
  EventSummary,
} from "@vulkan/lib/services/event-metrics.service.types";

export const EventMetricsService: EventMetricsServiceType = {
  safeRate(numerator: number, denominator: number): number {
    if (denominator <= 0) return 0;
    return Math.round((numerator / denominator) * 10000) / 10000;
  },

  async getMetrics(event: SalesEvent): Promise<EventMetrics> {
    const [invitation, seats, interest] = await Promise.all([
      InvitationsRepository.getStats(event.id),
      CapacityRepository.getSeatCounts(event.id, new Date()),
      ClientInterestsRepository.getInterestStats(event.id),
    ]);

    return {
      eventId: event.id,
      status: event.status,
      capacity: event.capacity,
      totalInvites: invitation.invited,
      openedInvites: invitation.opened,
      registrationsStarted: invitation.started,
      registrationsSubmitted: invitation.confirmed,
      clientsWithInterestsSubmitted: interest.total,
      seatsReserved: seats.reservedSeats,
      seatsConfirmed: seats.confirmedSeats,
      remainingCapacity: Math.max(0, event.capacity - seats.confirmedSeats),
      mostSelectedProducts: interest.topProducts,
      mostSelectedServices: interest.topServices,
    };
  },

  async getSummary(event: SalesEvent): Promise<EventSummary> {
    const [offeringsConfigured, invitation, seats, interest] =
      await Promise.all([
        EventOfferingsRepository.countAssigned(event.id),
        InvitationsRepository.getStats(event.id),
        CapacityRepository.getSeatCounts(event.id, new Date()),
        ClientInterestsRepository.getInterestStats(event.id),
      ]);

    const totalInvited = invitation.invited;
    const totalRegistered = invitation.confirmed;
    const portfoliosGenerated = 0;
    const portfoliosAccepted = 0;

    const distribution = [
      ...interest.topProducts,
      ...interest.topServices,
    ].sort((a, b) => b.count - a.count);

    return {
      eventId: event.id,
      status: event.status,
      capacity: event.capacity,
      offeringsConfigured,
      totalInvited,
      totalRegistered,
      registrationRate: EventMetricsService.safeRate(
        totalRegistered,
        totalInvited,
      ),
      seatsConfirmed: seats.confirmedSeats,
      confirmedAttendanceRate: EventMetricsService.safeRate(
        seats.confirmedSeats,
        totalInvited,
      ),
      mostSelectedProducts: interest.topProducts,
      mostSelectedServices: interest.topServices,
      interestDistribution: distribution,
      topRequestedOfferings: distribution,
      totalInterestSelections: interest.total,
      portfoliosGenerated,
      portfolioGenerationCompletionRate: EventMetricsService.safeRate(
        portfoliosGenerated,
        totalRegistered,
      ),
      portfoliosAccepted,
      conversionRate: EventMetricsService.safeRate(
        portfoliosAccepted,
        portfoliosGenerated,
      ),
    };
  },
};
