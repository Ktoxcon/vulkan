import { AppConfig } from "@vulkan/config/app.config";
import { Redis } from "ioredis";

let connectionSingleton: Redis | null = null;

export function getQueueConnection(): Redis {
  if (!connectionSingleton) {
    connectionSingleton = new Redis({
      host: AppConfig.redis.host,
      port: AppConfig.redis.port,
      maxRetriesPerRequest: null,
    });
  }
  return connectionSingleton;
}
