import { SeatReservationController } from "@vulkan/controllers/seat-reservation.controller";
import { Router } from "express";

export const SeatReservationRoutes = Router({ mergeParams: true });

SeatReservationRoutes.post(
  "/:token/reservation",
  SeatReservationController.create,
);
