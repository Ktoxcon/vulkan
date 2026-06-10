import type {
  CreateSalesEventRequestBodySchema,
  ListSalesEventsQuerySchema,
  UpdateSalesEventRequestBodySchema,
} from "@vulkan/lib/validators/sales-event.schemas";
import type { z } from "zod";

export type CreateSalesEventRequestBody = z.infer<
  typeof CreateSalesEventRequestBodySchema
>;

export type UpdateSalesEventRequestBody = z.infer<
  typeof UpdateSalesEventRequestBodySchema
>;

export type ListSalesEventsQuery = z.infer<typeof ListSalesEventsQuerySchema>;
