import { UserRoles } from "@vulkan/lib/constants/roles";
import { UserStatus } from "@vulkan/lib/constants/user-status";
import type { User } from "@vulkan/lib/db/schema/users";
import { UsersRepository } from "@vulkan/lib/repositories/users.repo";
import { hash } from "argon2";

export const DEFAULT_PASSWORD = "password123";

export async function makeUser(
  overrides: Partial<{
    email: string;
    name: string;
    lastName: string;
    role: string;
    password: string;
    status: string;
  }> = {},
): Promise<User> {
  const role = overrides.role ?? UserRoles.SALES;
  return UsersRepository.create({
    email:
      overrides.email ??
      `${role}-${Math.random().toString(36).slice(2)}@vulkan.com`,
    name: overrides.name ?? "Test",
    lastName: overrides.lastName ?? "User",
    role,
    status: overrides.status ?? UserStatus.ACTIVE,
    passwordHash: await hash(overrides.password ?? DEFAULT_PASSWORD),
  });
}
