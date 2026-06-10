import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";

export class EmailTemplateNotFoundError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 404,
      code: "EMAIL_TEMPLATE_NOT_FOUND",
      message: "Email template not found for this event.",
    });
  }
}

export class EmailTemplateAlreadyExistsError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "EMAIL_TEMPLATE_ALREADY_EXISTS",
      message: "An email template already exists for this event.",
    });
  }
}

export class EmailTemplateLockedError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "EMAIL_TEMPLATE_LOCKED",
      message: "Email templates can only be changed while the event is in Draft.",
    });
  }
}
