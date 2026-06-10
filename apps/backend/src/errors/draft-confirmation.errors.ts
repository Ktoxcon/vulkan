import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";

export class DraftConfirmationAlreadyConfirmedError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "DRAFT_CONFIRMATION_ALREADY_CONFIRMED",
      message: "This invitation has already been confirmed.",
    });
  }
}
