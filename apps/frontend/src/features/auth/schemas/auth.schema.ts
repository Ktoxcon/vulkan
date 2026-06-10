import { z } from "zod"
import type { SignInInput } from "@/features/auth/types/auth.types"

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "validation:emailRequired")
    .email("validation:email"),
  password: z.string().min(1, "validation:passwordRequired"),
}) satisfies z.ZodType<SignInInput>
