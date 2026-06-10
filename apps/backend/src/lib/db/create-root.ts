import { AppConfig } from "@vulkan/config/app.config";
import { UserRoles } from "@vulkan/lib/constants/roles";
import { UserStatus } from "@vulkan/lib/constants/user-status";
import { UsersRepository } from "@vulkan/lib/repositories/users.repo";
import { hash } from "argon2";

export async function createRootUser() {
  const email = AppConfig.root.email;

  const existing = await UsersRepository.findByEmail(email);

  if (existing) {
    return existing.id;
  }

  const passwordHash = await hash(AppConfig.root.password);

  const created = await UsersRepository.create({
    email,
    name: "Root",
    lastName: "Admin",
    role: UserRoles.ADMIN,
    status: UserStatus.ACTIVE,
    passwordHash,
  });

  return created.id;
}
