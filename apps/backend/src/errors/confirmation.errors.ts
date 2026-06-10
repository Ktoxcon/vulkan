import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";

export class EmailMismatchError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 400,
      code: "EMAIL_MISMATCH",
      message: "The provided email does not match the invitation.",
    });
  }
}

export class InvalidAttendanceDateError extends VulkanApiError {
  constructor(availableAttendanceDates: string[]) {
    super({
      httpStatusCode: 400,
      code: "INVALID_ATTENDANCE_DATE",
      message: "The selected attendance date is not available for this event.",
      details: { availableAttendanceDates },
    });
  }
}

export class ReservationExpiredError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "RESERVATION_EXPIRED",
      message: "Your seat reservation has expired. Please start again.",
    });
  }
}
