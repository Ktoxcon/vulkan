import path from "node:path";

export const AppConfig = {
  port: Number(process.env.SERVER_PORT ?? 3300),
  appUrl: process.env.APP_URL ?? "http://localhost:5173",
  serveClient:
    (process.env.SERVE_CLIENT ??
      (process.env.NODE_ENV === "production" ? "true" : "false")) === "true",
  clientDir: process.env.CLIENT_DIR ?? path.join(__dirname, "../../public"),
  cookiesSecret: process.env.COOKIES_SECRET ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "",
  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 5432),
    name: process.env.DB_NAME ?? "vulkan",
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "",
  },
  root: {
    email: process.env.ROOT_EMAIL ?? "root@vulkan.com",
    password: process.env.ROOT_PASSWORD ?? "",
  },
  redis: {
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: Number(process.env.REDIS_PORT ?? 6379),
  },
  smtp: {
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: (process.env.SMTP_SECURE ?? "true") === "true",
    user: process.env.EMAIL_APP_ADDRESS ?? "",
    pass: process.env.EMAIL_APP_TOKEN ?? "",
    from: process.env.EMAIL_APP_ADDRESS ?? "",
  },
};

export default AppConfig;
