import type { VulkanApiErrorArgs } from "@vulkan/errors/vulkan-api-error.types";

export class VulkanApiError extends Error {
  readonly httpStatusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(args: VulkanApiErrorArgs) {
    super(args.message);
    this.name = new.target.name;
    this.httpStatusCode = args.httpStatusCode;
    this.code = args.code;
    this.details = args.details;
  }
}
