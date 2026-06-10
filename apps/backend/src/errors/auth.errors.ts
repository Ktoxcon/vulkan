import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";

export class InvalidCredentialsError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 401,
      code: "INVALID_CREDENTIALS",
      message: "Email or password are incorrect.",
    });
  }
}

export class InvalidResetTokenError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 401,
      code: "INVALID_RESET_TOKEN",
      message: "Invalid or expired token.",
    });
  }
}
