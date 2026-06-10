import { AppConfig } from "@vulkan/config/app.config";
import { UnauthorizedError } from "@vulkan/errors/common.errors";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { verify } from "jsonwebtoken";

export const AuthMiddleware = withErrorHandling((request, response, next) => {
  const { session } = request.cookies;

  if (!session) {
    throw new UnauthorizedError();
  }

  try {
    response.locals.session = verify(session, AppConfig.sessionSecret);
  } catch {
    throw new UnauthorizedError();
  }

  next();
});
