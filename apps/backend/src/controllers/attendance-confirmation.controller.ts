import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { AttendanceConfirmationService } from "@vulkan/lib/services/attendance-confirmation.service";
import { AttendanceConfirmationBodySchema } from "@vulkan/lib/validators/attendance-confirmation.schemas";
import { InvitationTokenParamSchema } from "@vulkan/lib/validators/invitation.schemas";
import type { Request, Response } from "express";

export const AttendanceConfirmationController = {
  create: withErrorHandling(async (request: Request, response: Response) => {
    const token = InvitationTokenParamSchema.parse(request.params.token);
    const body = AttendanceConfirmationBodySchema.parse(request.body);

    const data = await AttendanceConfirmationService.confirm(token, body);

    response.status(201).send({ success: true, data });
  }),
};
