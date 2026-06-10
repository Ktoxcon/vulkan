import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import {
  DEFAULT_NAMESPACE,
  NAMESPACES,
  SUPPORTED_LANGUAGES,
} from "@/lib/i18n/i18n.constants"
import type { ResourceKey } from "i18next"
import type { I18nResources } from "@/lib/i18n/i18n.types"

const files = import.meta.glob("./locales/*/*.json", { eager: true })

const resources: I18nResources = {}

for (const path in files) {
  const match = path.match(/^\.\/locales\/([^/]+)\/(.+)\.json$/)
  if (!match) continue
  const [, language, namespace] = match
  resources[language] ??= {}
  resources[language][namespace] = (files[path] as { default: ResourceKey })
    .default
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "es",
    supportedLngs: SUPPORTED_LANGUAGES,
    load: "languageOnly",
    defaultNS: DEFAULT_NAMESPACE,
    ns: NAMESPACES,
    detection: { order: ["localStorage"], caches: ["localStorage"] },
    interpolation: { escapeValue: false },
    resources,
  })

export default i18n
