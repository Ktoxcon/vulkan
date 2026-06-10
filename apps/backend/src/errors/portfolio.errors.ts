import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";

export class PortfolioNotFoundError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 404,
      code: "PORTFOLIO_NOT_FOUND",
      message: "Portfolio not found.",
    });
  }
}

export class InvalidPortfolioTransitionError extends VulkanApiError {
  constructor(from: string, to: string, allowed: readonly string[]) {
    super({
      httpStatusCode: 409,
      code: "INVALID_PORTFOLIO_TRANSITION",
      message: `Cannot transition portfolio from ${from} to ${to}.`,
      details: { allowed },
    });
  }
}

export class PortfolioAccessDeniedError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 403,
      code: "PORTFOLIO_ACCESS_DENIED",
      message: "You do not have access to this portfolio.",
    });
  }
}
