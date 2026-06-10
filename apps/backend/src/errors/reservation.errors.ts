import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";

export class ReservationNotFoundError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 404,
      code: "RESERVATION_NOT_FOUND",
      message: "Reservation not found.",
    });
  }
}
