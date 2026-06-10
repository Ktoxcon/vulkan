import { ApiRouter } from "@vulkan/app/api.router";
import AppConfig from "@vulkan/config/app.config";
import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { JsonMiddleware } from "@vulkan/middleware/json.middleware";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "node:path";

export const app = express();

if (process.env.NODE_ENV !== "production") {
  app.use(cors());
}

app.use(cookieParser());
app.use(JsonMiddleware);
app.use(morgan("combined"));
app.use(API_PREFIX, ApiRouter);

if (AppConfig.serveClient) {
  app.use(express.static(AppConfig.clientDir));

  app.use((request, response, next) => {
    if (
      request.method === "GET" &&
      (request.headers.accept ?? "").includes("text/html")
    ) {
      return response.sendFile(path.join(AppConfig.clientDir, "index.html"));
    }

    next();
  });
}
