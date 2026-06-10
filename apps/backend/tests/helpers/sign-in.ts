import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import type { Express } from "express";
import request from "supertest";

export async function signIn(
  app: Express,
  email: string,
  password = "password123",
): Promise<string> {
  const response = await request(app)
    .post(`${API_PREFIX}/auth/session`)
    .send({ email, password });
  const cookies = response.headers["set-cookie"] as unknown as string[];
  return cookies?.find((cookie) => cookie.startsWith("session=")) ?? "";
}
