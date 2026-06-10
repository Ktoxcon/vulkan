import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";

export class OfferingNotFoundError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 404,
      code: "OFFERING_NOT_FOUND",
      message: "Offering not found.",
    });
  }
}

export class DuplicateOfferingError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "DUPLICATE_OFFERING",
      message: "An offering with this name and type already exists.",
    });
  }
}

export class OfferingInactiveError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "OFFERING_INACTIVE",
      message: "Only active offerings can be assigned to an event.",
    });
  }
}

export class OfferingNotSelectableError extends VulkanApiError {
  constructor(offeringIds: string[]) {
    super({
      httpStatusCode: 409,
      code: "OFFERING_NOT_SELECTABLE",
      message: "One or more offerings are not assigned to the event or not active.",
      details: { offeringIds },
    });
  }
}

export class DuplicateEventOfferingError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "DUPLICATE_EVENT_OFFERING",
      message: "Offering is already assigned to this event.",
    });
  }
}

export class EventOfferingNotAssignedError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 404,
      code: "EVENT_OFFERING_NOT_ASSIGNED",
      message: "Offering is not assigned to this event.",
    });
  }
}

export class MissingSessionError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 401,
      code: "MISSING_SESSION",
      message: "Missing or invalid session.",
    });
  }
}
