import { seatReservations } from "@vulkan/lib/db/schema/seat-reservations";

export type SeatReservation = typeof seatReservations.$inferSelect;
export type NewSeatReservation = typeof seatReservations.$inferInsert;
