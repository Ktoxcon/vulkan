export const SUPPORTED_LANGUAGES = ["es", "en"] as const

export const DEFAULT_NAMESPACE = "common"

export const NAMESPACES = [
  "common",
  "auth",
  "errors",
  "validation",
  "events",
  "catalog",
  "users",
  "roster",
  "invitations",
  "email-templates",
  "portfolios",
  "invitation-flow",
  "dashboard",
] as const

export const INTL_LOCALE_BY_LANGUAGE: Record<string, string> = {
  es: "es-ES",
  en: "en-US",
}

export const FALLBACK_INTL_LOCALE = "es-ES"
