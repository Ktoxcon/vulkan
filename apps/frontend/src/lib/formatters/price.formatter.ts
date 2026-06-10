import i18n from "@/lib/i18n/i18n"
import {
  FALLBACK_INTL_LOCALE,
  INTL_LOCALE_BY_LANGUAGE,
} from "@/lib/i18n/i18n.constants"

const QUETZAL_SYMBOL = "Q"

export function formatPrice(value: string | number): string {
  const amount = Number(value)
  if (Number.isNaN(amount)) return String(value)

  const locale = INTL_LOCALE_BY_LANGUAGE[i18n.language] ?? FALLBACK_INTL_LOCALE
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${QUETZAL_SYMBOL}${formatted}`
}
