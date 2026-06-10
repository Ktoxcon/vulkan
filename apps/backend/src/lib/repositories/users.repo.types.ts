import type { User } from "@vulkan/lib/db/schema/users.types";
import type { UsersRepository } from "@vulkan/lib/repositories/users.repo";

export type ListUsersParams = {
  limit?: number;
  offset?: number;
};

export type ListUsersResult = {
  count: number;
  items: User[];
};

export type UsersRepositoryType = typeof UsersRepository;
