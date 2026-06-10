import { EventStatus } from "@vulkan/lib/constants/event-status";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events";
import { SalesEventsRepository } from "@vulkan/lib/repositories/sales-events.repo";

export type MakeSalesEventOverrides = Partial<{
  name: string;
  capacity: number;
  status: string;
  eventStartDate: Date;
  eventEndDate: Date;
  registrationStartDate: Date;
  registrationEndDate: Date;
  reservationTimeoutMinutes: number;
}>;

export async function makeSalesEvent(
  ownerId: string,
  overrides: MakeSalesEventOverrides = {},
): Promise<SalesEvent> {
  return SalesEventsRepository.create({
    ownerId,
    name: overrides.name ?? "Annual Promo",
    capacity: overrides.capacity ?? 30,
    eventStartDate:
      overrides.eventStartDate ?? new Date("2099-08-30T00:00:00.000Z"),
    ...(overrides.eventEndDate !== undefined
      ? { eventEndDate: overrides.eventEndDate }
      : {}),
    registrationStartDate:
      overrides.registrationStartDate ?? new Date("2026-08-01T00:00:00.000Z"),
    registrationEndDate:
      overrides.registrationEndDate ?? new Date("2026-08-15T00:00:00.000Z"),
    ...(overrides.reservationTimeoutMinutes !== undefined
      ? { reservationTimeoutMinutes: overrides.reservationTimeoutMinutes }
      : {}),
    status: overrides.status ?? EventStatus.DRAFT,
  });
}

export const validSalesEventBody = {
  name: "Annual Promo 2026",
  description: "Yearly promotional event",
  capacity: 30,
  reservationTimeoutMinutes: 15,
  requireConfirmation: true,
  eventStartDate: "2099-08-30T00:00:00.000Z",
  registrationStartDate: "2026-08-01T00:00:00.000Z",
  registrationEndDate: "2026-08-15T00:00:00.000Z",
};
