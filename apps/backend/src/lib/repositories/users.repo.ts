import { db } from "@vulkan/lib/db/index";
import { users } from "@vulkan/lib/db/schema/users";
import type { NewUser, User } from "@vulkan/lib/db/schema/users.types";
import type {
  ListUsersParams,
  ListUsersResult,
} from "@vulkan/lib/repositories/users.repo.types";
import { count, eq } from "drizzle-orm";

export const UsersRepository = {
  async findById(id: string): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return row;
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return row;
  },

  async create(input: NewUser): Promise<User> {
    const [row] = await db.insert(users).values(input).returning();
    return row as User;
  },

  async update(id: string, patch: Partial<NewUser>): Promise<User | undefined> {
    const [row] = await db
      .update(users)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return row;
  },

  async updatePasswordHash(
    id: string,
    passwordHash: string,
  ): Promise<User | undefined> {
    return this.update(id, { passwordHash });
  },

  async list(params: ListUsersParams = {}): Promise<ListUsersResult> {
    const limit = params.limit ?? 10;
    const offset = params.offset ?? 0;

    const items = await db.select().from(users).limit(limit).offset(offset);

    const [totals] = await db.select({ value: count() }).from(users);

    return { count: totals?.value ?? 0, items };
  },
};
