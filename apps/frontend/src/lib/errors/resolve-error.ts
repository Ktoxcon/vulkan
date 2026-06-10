import i18n from "@/lib/i18n/i18n"
import { ApiError } from "@/lib/errors/api.error"

export function resolveError(error: unknown): string {
  if (error instanceof ApiError) {
    return i18n.t(`errors:${error.code}`, { defaultValue: error.message })
  }
  if (error instanceof Error) return error.message

  return i18n.t("errors:generic", {
    defaultValue: "Something went wrong. Please try again.",
  })
}
