import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";

export class DispatchTemplateMissingError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "DISPATCH_TEMPLATE_MISSING",
      message: "An email template is required before invitations can be sent.",
    });
  }
}

export class DispatchNoPendingInvitationsError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "DISPATCH_NO_PENDING_INVITATIONS",
      message: "There are no pending invitations to dispatch for this event.",
    });
  }
}

export class DispatchInvitationNotFoundError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 404,
      code: "DISPATCH_INVITATION_NOT_FOUND",
      message: "The invitation referenced by this job no longer exists.",
    });
  }
}

export class DispatchTemplateNotFoundError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 404,
      code: "DISPATCH_TEMPLATE_NOT_FOUND",
      message: "No email template was found for the event while sending.",
    });
  }
}
