import { UsersController } from "@vulkan/controllers/users.controller";
import { AdminMiddleware } from "@vulkan/middleware/admin.middleware";
import { AuthMiddleware } from "@vulkan/middleware/auth.middleware";
import { Router } from "express";

export const UserRoutes = Router();

UserRoutes.get("/", AuthMiddleware, AdminMiddleware, UsersController.listUsers);
UserRoutes.post("/", AuthMiddleware, AdminMiddleware, UsersController.createUser);
UserRoutes.get(
  "/:id",
  AuthMiddleware,
  AdminMiddleware,
  UsersController.getUser,
);
UserRoutes.patch(
  "/:id",
  AuthMiddleware,
  AdminMiddleware,
  UsersController.updateUser,
);
