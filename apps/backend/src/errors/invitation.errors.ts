import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";

export class InvitationsRosterMissingError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "INVITATIONS_ROSTER_MISSING",
      message: "A roster with at least one client is required before generating invitations.",
    });
  }
}

export class InvitationTokenNotFoundError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 404,
      code: "INVITATION_TOKEN_NOT_FOUND",
      message: "Invitation token not found.",
    });
  }
}
