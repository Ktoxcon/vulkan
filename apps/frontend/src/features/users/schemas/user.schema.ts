import { z } from "zod"

const roleEnum = z.enum(["admin", "sales"])
const statusEnum = z.enum(["PENDING", "ACTIVE", "INACTIVE"])

export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "validation:emailRequired")
    .email("validation:email"),
  name: z.string().min(1, "users:validation.firstNameRequired"),
  lastName: z.string().min(1, "users:validation.lastNameRequired"),
  password: z.string().min(8, "users:validation.passwordMin"),
  role: roleEnum,
  status: statusEnum,
})

export const editUserSchema = z.object({
  name: z.string().min(1, "users:validation.firstNameRequired"),
  lastName: z.string().min(1, "users:validation.lastNameRequired"),
  role: roleEnum,
  status: statusEnum,
  password: z
    .string()
    .min(8, "users:validation.passwordMin")
    .optional()
    .or(z.literal("")),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>

export type EditUserFormValues = z.infer<typeof editUserSchema>
