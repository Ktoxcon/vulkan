import { z } from "zod"

export const statusChangeSchema = z.object({
  status: z.enum(["draft", "reviewed", "sent", "accepted", "rejected", "closed"]),
})

export type StatusChangeInput = z.infer<typeof statusChangeSchema>
