import { AuthController } from "@vulkan/controllers/auth.controller";
import { AuthMiddleware } from "@vulkan/middleware/auth.middleware";
import { Router } from "express";

export const AuthRoutes = Router();

AuthRoutes.post("/session", AuthController.signIn);
AuthRoutes.delete("/session", AuthController.signOut);
AuthRoutes.get("/me", AuthMiddleware, AuthController.me);
AuthRoutes.post("/password-reset", AuthController.requestPasswordReset);
AuthRoutes.patch("/password", AuthController.updatePassword);
