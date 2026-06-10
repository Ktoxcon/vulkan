import { OfferingImportsController } from "@vulkan/controllers/offering-imports.controller";
import { AdminMiddleware } from "@vulkan/middleware/admin.middleware";
import { AuthMiddleware } from "@vulkan/middleware/auth.middleware";
import { FormDataMiddleware } from "@vulkan/middleware/form-data.middleware";
import { Router } from "express";

export const OfferingImportsRoutes = Router();

OfferingImportsRoutes.post(
  "/",
  AuthMiddleware,
  AdminMiddleware,
  FormDataMiddleware,
  OfferingImportsController.createImport,
);

OfferingImportsRoutes.get(
  "/:importId",
  AuthMiddleware,
  AdminMiddleware,
  OfferingImportsController.getImport,
);

OfferingImportsRoutes.patch(
  "/:importId",
  AuthMiddleware,
  AdminMiddleware,
  OfferingImportsController.confirmImport,
);
