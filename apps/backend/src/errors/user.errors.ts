import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";

export class UserNotFoundError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 404,
      code: "USER_NOT_FOUND",
      message: "User not found.",
    });
  }
}

export class UserAlreadyExistsError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "USER_ALREADY_EXISTS",
      message: "User already exists.",
    });
  }
}
