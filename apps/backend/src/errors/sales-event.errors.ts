import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";

export class EventNotFoundError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 404,
      code: "EVENT_NOT_FOUND",
      message: "Event not found.",
    });
  }
}

export class EventForbiddenError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 403,
      code: "EVENT_FORBIDDEN",
      message: "You do not have access to this event.",
    });
  }
}

export class IllegalEventTransitionError extends VulkanApiError {
  constructor(from: string, to: string) {
    super({
      httpStatusCode: 409,
      code: "ILLEGAL_EVENT_TRANSITION",
      message: `Cannot transition event from ${from} to ${to}.`,
    });
  }
}

export class EventNotReadyError extends VulkanApiError {
  constructor(details?: unknown) {
    super({
      httpStatusCode: 409,
      code: "EVENT_NOT_READY",
      message: "Event is not ready to launch.",
      details,
    });
  }
}

export class CapacityBelowConfirmedError extends VulkanApiError {
  constructor(confirmedSeats: number) {
    super({
      httpStatusCode: 409,
      code: "CAPACITY_BELOW_CONFIRMED",
      message: `Capacity cannot be reduced below confirmed seats (${confirmedSeats}).`,
    });
  }
}

export class EventFieldsLockedError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "EVENT_FIELDS_LOCKED",
      message: "Structural fields can only be changed while the event is in Draft.",
    });
  }
}
