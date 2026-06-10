import type { ReservationStatus as ReservationStatusType } from "@vulkan/lib/constants/reservation-status.types";

export const ReservationStatus = {
  ACTIVE: "active",
  EXPIRED: "expired",
  CONFIRMED: "confirmed",
} as const;

export const ReservationStatusValues = Object.values(ReservationStatus) as [
  ReservationStatusType,
  ...ReservationStatusType[],
];
