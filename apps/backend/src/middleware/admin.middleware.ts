import { ForbiddenError } from "@vulkan/errors/common.errors";
import { UserRoles } from "@vulkan/lib/constants/roles";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";

export const AdminMiddleware = withErrorHandling((_request, response, next) => {
  const session = response.locals.session as { data: { userRole: string } };

  if (session.data.userRole !== UserRoles.ADMIN) {
    throw new ForbiddenError();
  }

  next();
});
