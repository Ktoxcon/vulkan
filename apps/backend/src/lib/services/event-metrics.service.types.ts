import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import type { OfferingInterest } from "@vulkan/lib/repositories/client-interests.repo.types";

export type EventMetrics = {
  eventId: string;
  status: string;
  capacity: number;
  totalInvites: number;
  openedInvites: number;
  registrationsStarted: number;
  registrationsSubmitted: number;
  clientsWithInterestsSubmitted: number;
  seatsReserved: number;
  seatsConfirmed: number;
  remainingCapacity: number;
  mostSelectedProducts: OfferingInterest[];
  mostSelectedServices: OfferingInterest[];
};

export type EventSummary = {
  eventId: string;
  status: string;
  capacity: number;
  offeringsConfigured: number;
  totalInvited: number;
  totalRegistered: number;
  registrationRate: number;
  seatsConfirmed: number;
  confirmedAttendanceRate: number;
  mostSelectedProducts: OfferingInterest[];
  mostSelectedServices: OfferingInterest[];
  interestDistribution: OfferingInterest[];
  topRequestedOfferings: OfferingInterest[];
  totalInterestSelections: number;
  portfoliosGenerated: number;
  portfolioGenerationCompletionRate: number;
  portfoliosAccepted: number;
  conversionRate: number;
};

export type EventMetricsServiceType = {
  safeRate(numerator: number, denominator: number): number;
  getMetrics(event: SalesEvent): Promise<EventMetrics>;
  getSummary(event: SalesEvent): Promise<EventSummary>;
};
