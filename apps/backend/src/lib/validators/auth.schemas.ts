import { z } from "zod";

export const PasswordResetRequestBodySchema = z.object({
  email: z.email(),
});

export const SignInRequestBodySchema = PasswordResetRequestBodySchema.extend({
  password: z.string().nonempty().min(8),
});

export const PasswordUpdateRequestBodySchema = z.object({
  token: z.string().nonempty(),
  password: z.string().nonempty().min(8),
});
