import { ApiRouter } from "@vulkan/app/api.router";
import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import cookieParser from "cookie-parser";
import express, { type Express } from "express";

export function createTestApp(): Express {
  const app = express();

  app.use(cookieParser());
  app.use(express.json());

  app.use(API_PREFIX, ApiRouter);

  return app;
}
