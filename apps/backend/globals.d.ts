declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: "development" | "test" | "production";
    SERVER_PORT?: string;
    APP_URL?: string;
    SERVE_CLIENT?: string;
    CLIENT_DIR?: string;
    SESSION_SECRET?: string;
    COOKIES_SECRET?: string;
    DB_NAME?: string;
    DB_USER?: string;
    DB_PASSWORD?: string;
    DB_HOST?: string;
    DB_PORT?: string;
    ROOT_EMAIL?: string;
    ROOT_PASSWORD?: string;
    REDIS_HOST?: string;
    REDIS_PORT?: string;
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_SECURE?: string;
    EMAIL_APP_ADDRESS?: string;
    EMAIL_APP_TOKEN?: string;
  }
}
