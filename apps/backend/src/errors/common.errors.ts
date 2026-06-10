import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";

export class ValidationError extends VulkanApiError {
  constructor(details?: unknown) {
    super({
      httpStatusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid request payload.",
      details,
    });
  }
}

export class InternalError extends VulkanApiError {
  constructor(message = "Internal server error.") {
    super({
      httpStatusCode: 500,
      code: "INTERNAL_SERVER_ERROR",
      message,
    });
  }
}

export class UnauthorizedError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 401,
      code: "UNAUTHORIZED",
      message: "Unauthorized request.",
    });
  }
}

export class ForbiddenError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 403,
      code: "FORBIDDEN",
      message: "Forbidden.",
    });
  }
}

export class NotFoundError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 404,
      code: "NOT_FOUND",
      message: "Resource not found.",
    });
  }
}
