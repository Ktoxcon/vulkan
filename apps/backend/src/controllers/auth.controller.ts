import { AppConfig } from "@vulkan/config/app.config";
import {
  InvalidCredentialsError,
  InvalidResetTokenError,
} from "@vulkan/errors/auth.errors";
import { UserNotFoundError } from "@vulkan/errors/user.errors";
import { DayInMilliseconds } from "@vulkan/lib/constants/time";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { UsersRepository } from "@vulkan/lib/repositories/users.repo";
import {
  PasswordResetRequestBodySchema,
  PasswordUpdateRequestBodySchema,
  SignInRequestBodySchema,
} from "@vulkan/lib/validators/auth.schemas";
import { hash, verify } from "argon2";
import type { Request, Response } from "express";
import { type JwtPayload, sign, verify as verifyToken } from "jsonwebtoken";

export const AuthController = {
  signIn: withErrorHandling(async (request: Request, response: Response) => {
    const { email, password } = SignInRequestBodySchema.parse(request.body);

    const user = await UsersRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await verify(user.passwordHash, password);

    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const session = sign(
      { data: { id: user.id, userRole: user.role } },
      AppConfig.sessionSecret,
      { expiresIn: "24h" },
    );

    response.cookie("session", session, {
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: DayInMilliseconds,
    });

    response.status(200).send({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        userRole: user.role,
      },
    });
  }),

  me: withErrorHandling(async (_request: Request, response: Response) => {
    const id = response.locals.session.data.id as string;

    const user = await UsersRepository.findById(id);

    if (!user) {
      throw new UserNotFoundError();
    }

    response.status(200).send({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        userRole: user.role,
      },
    });
  }),

  signOut: withErrorHandling(async (_request: Request, response: Response) => {
    response.clearCookie("session");
    response.status(200).send({ success: true, data: null });
  }),

  requestPasswordReset: withErrorHandling(
    async (request: Request, response: Response) => {
      PasswordResetRequestBodySchema.parse(request.body);

      response.status(200).send({ success: true, data: null });
    },
  ),

  updatePassword: withErrorHandling(
    async (request: Request, response: Response) => {
      const { password, token } = PasswordUpdateRequestBodySchema.parse(
        request.body,
      );

      let decodedToken: JwtPayload;

      try {
        decodedToken = verifyToken(
          token,
          AppConfig.sessionSecret,
        ) as JwtPayload;
      } catch {
        throw new InvalidResetTokenError();
      }

      const id = decodedToken.data?.id as string | undefined;

      if (!id) {
        throw new InvalidResetTokenError();
      }

      const user = await UsersRepository.findById(id);

      if (!user) {
        throw new UserNotFoundError();
      }

      const passwordHash = await hash(password);

      await UsersRepository.updatePasswordHash(id, passwordHash);

      response.status(200).send({ success: true, data: null });
    },
  ),
};
