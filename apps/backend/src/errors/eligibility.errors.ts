import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";

export class InvalidTokenError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 404,
      code: "INVALID_TOKEN",
      message: "This invitation is invalid.",
    });
  }
}

export class RegistrationNotStartedError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "REGISTRATION_NOT_STARTED",
      message: "Registration is not yet open.",
    });
  }
}

export class RegistrationClosedError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "REGISTRATION_CLOSED",
      message: "Registration for this event is closed.",
    });
  }
}

export class EventPausedError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "EVENT_PAUSED",
      message: "Registration is temporarily unavailable.",
    });
  }
}

export class CapacityReachedError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "CAPACITY_REACHED",
      message: "No seats are currently available for this event.",
    });
  }
}

export class AlreadyConfirmedError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "ALREADY_CONFIRMED",
      message: "Your attendance has already been confirmed.",
    });
  }
}
