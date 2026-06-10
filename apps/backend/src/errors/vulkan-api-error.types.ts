export type VulkanApiErrorArgs = {
  httpStatusCode: number;
  code: string;
  message: string;
  details?: unknown;
};
