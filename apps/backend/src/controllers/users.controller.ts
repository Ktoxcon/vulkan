import {
  UserAlreadyExistsError,
  UserNotFoundError,
} from "@vulkan/errors/user.errors";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { UsersRepository } from "@vulkan/lib/repositories/users.repo";
import { IdParamSchema } from "@vulkan/lib/validators/model.schemas";
import {
  CreateUserRequestBodySchema,
  EditUserSchema,
  ListUsersRequestBodySchema,
} from "@vulkan/lib/validators/user.schemas";
import { hash } from "argon2";
import type { Request, Response } from "express";

export const UsersController = {
  getUser: withErrorHandling(async (request: Request, response: Response) => {
    const id = IdParamSchema.parse(request.params.id);

    const user = await UsersRepository.findById(id);

    if (!user) {
      throw new UserNotFoundError();
    }

    response.status(200).send({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }),

  createUser: withErrorHandling(
    async (request: Request, response: Response) => {
      const { email, name, lastName, userRole, password, status } =
        CreateUserRequestBodySchema.parse(request.body);

      const existing = await UsersRepository.findByEmail(email);

      if (existing) {
        throw new UserAlreadyExistsError();
      }

      const passwordHash = await hash(password);

      const user = await UsersRepository.create({
        email,
        name,
        lastName,
        role: userRole,
        passwordHash,
        ...(status ? { status } : {}),
      });

      response.status(201).send({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    },
  ),

  updateUser: withErrorHandling(
    async (request: Request, response: Response) => {
      const id = IdParamSchema.parse(request.params.id);
      const patch = EditUserSchema.parse(request.body);

      const existing = await UsersRepository.findById(id);

      if (!existing) {
        throw new UserNotFoundError();
      }

      const { userRole, password, ...rest } = patch;
      const updatePayload: Record<string, unknown> = { ...rest };
      if (userRole) updatePayload.role = userRole;
      if (password) updatePayload.passwordHash = await hash(password);

      const user = await UsersRepository.update(id, updatePayload);
      if (!user) {
        throw new UserNotFoundError();
      }

      response.status(200).send({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    },
  ),

  listUsers: withErrorHandling(async (request: Request, response: Response) => {
    const { limit, offset } = ListUsersRequestBodySchema.parse(request.query);

    const result = await UsersRepository.list({
      ...(limit !== undefined ? { limit } : {}),
      ...(offset !== undefined ? { offset } : {}),
    });

    response.status(200).send({
      success: true,
      data: {
        count: result.count,
        items: result.items.map((user) => ({
          id: user.id,
          name: user.name,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
      },
    });
  }),
};
