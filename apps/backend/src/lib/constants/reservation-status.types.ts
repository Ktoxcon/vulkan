import type { ReservationStatus as ReservationStatusConst } from "@vulkan/lib/constants/reservation-status";

export type ReservationStatus =
  (typeof ReservationStatusConst)[keyof typeof ReservationStatusConst];
