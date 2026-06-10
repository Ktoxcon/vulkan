import { AttendanceConfirmationController } from "@vulkan/controllers/attendance-confirmation.controller";
import { Router } from "express";

export const AttendanceConfirmationRoutes = Router({ mergeParams: true });

AttendanceConfirmationRoutes.post(
  "/:token/confirmation",
  AttendanceConfirmationController.create,
);
