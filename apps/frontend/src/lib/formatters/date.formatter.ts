import i18n from "@/lib/i18n/i18n"
import {
  FALLBACK_INTL_LOCALE,
  INTL_LOCALE_BY_LANGUAGE,
} from "@/lib/i18n/i18n.constants"

export function formatDate(
  value?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const locale = INTL_LOCALE_BY_LANGUAGE[i18n.language] ?? FALLBACK_INTL_LOCALE

  return options
    ? date.toLocaleString(locale, options)
    : date.toLocaleString(locale)
}
