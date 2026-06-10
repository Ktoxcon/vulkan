import { DiscountPreviewController } from "@vulkan/controllers/discount-preview.controller";
import { Router } from "express";

export const DiscountPreviewRoutes = Router({ mergeParams: true });

DiscountPreviewRoutes.post(
  "/:token/discount-preview",
  DiscountPreviewController.create,
);
