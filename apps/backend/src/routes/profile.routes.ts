import { UsersController } from "@vulkan/controllers/users.controller";
import { AuthMiddleware } from "@vulkan/middleware/auth.middleware";
import { Router } from "express";

export const ProfileRoutes = Router();

ProfileRoutes.get("/:id", AuthMiddleware, UsersController.getUser);
ProfileRoutes.patch("/", AuthMiddleware, UsersController.updateUser);
