import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { SeatReservationService } from "@vulkan/lib/services/seat-reservation.service";
import { InvitationTokenParamSchema } from "@vulkan/lib/validators/invitation.schemas";
import type { Request, Response } from "express";

export const SeatReservationController = {
  create: withErrorHandling(async (request: Request, response: Response) => {
    const token = InvitationTokenParamSchema.parse(request.params.token);

    const result = await SeatReservationService.reserve(token);

    response
      .status(result.created ? 201 : 200)
      .send({ success: true, data: result.reservation });
  }),
};
