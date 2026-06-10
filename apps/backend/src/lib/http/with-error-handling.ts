import { ValidationError } from "@vulkan/errors/common.errors";
import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";
import type { HttpHandler } from "@vulkan/lib/http/with-error-handling.types";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function withErrorHandling(handler: HttpHandler) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      await handler(request, response, next);
    } catch (error: unknown) {
      if (response.headersSent) {
        console.error(error);
        return;
      }

      const apiError =
        error instanceof ZodError
          ? new ValidationError(error.flatten())
          : error instanceof VulkanApiError
            ? error
            : new VulkanApiError({
                httpStatusCode: 500,
                code: "INTERNAL_SERVER_ERROR",
                message:
                  error instanceof Error ? error.message : "Unexpected error.",
              });

      response.status(apiError.httpStatusCode).send({
        success: false,
        code: apiError.code,
        message: apiError.message,
        details: apiError.details,
      });
    }
  };
}
