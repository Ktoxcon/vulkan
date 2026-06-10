import { z } from "zod";

export const LimitSchema = z
  .string()
  .nonempty()
  .transform((limitString) => {
    const limit = Number(limitString);

    return Number.isNaN(limit) ? 10 : limit;
  });

export const OffsetSchema = z
  .string()
  .nonempty()
  .transform((offsetString) => {
    const offset = Number(offsetString);

    return Number.isNaN(offset) ? 0 : offset;
  });

export const PaginationRequestBody = z.object({
  limit: LimitSchema.optional(),
  offset: OffsetSchema.optional(),
});
