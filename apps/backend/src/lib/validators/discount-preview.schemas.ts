import { z } from "zod";

export const DiscountPreviewBodySchema = z.object({
  offeringIds: z.array(z.uuid()).nonempty(),
});
