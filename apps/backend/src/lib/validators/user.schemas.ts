import { UserRoles } from "@vulkan/lib/constants/roles";
import { UserStatus } from "@vulkan/lib/constants/user-status";
import { PaginationRequestBody } from "@vulkan/lib/validators/pagination.schemas";
import { z } from "zod";

const roleValues = Object.values(UserRoles) as [string, ...string[]];
const statusValues = Object.values(UserStatus) as [string, ...string[]];

export const CreateUserRequestBodySchema = z.object({
  email: z.email(),
  name: z.string().nonempty(),
  userRole: z.enum(roleValues),
  lastName: z.string().nonempty(),
  password: z.string().min(8),
  status: z.enum(statusValues).optional(),
});

export const EditUserSchema = CreateUserRequestBodySchema.partial();

export const ListUsersRequestBodySchema = PaginationRequestBody.extend({});
