import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { createInstance } from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import type { ResourceKey, i18n as I18nInstance } from "i18next"
import type { ReactNode } from "react"
import {
  DEFAULT_NAMESPACE,
  NAMESPACES,
  SUPPORTED_LANGUAGES,
} from "@/lib/i18n/i18n.constants"
import type { I18nResources } from "@/lib/i18n/i18n.types"
import appI18n from "@/lib/i18n/i18n"
import { LoginPage } from "@/features/auth/pages/login.page"
import { ForbiddenPage } from "@/app/forbidden.page"
import { I18nextProvider } from "react-i18next"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { server } from "../../msw/server"
import { meUnauthenticated } from "../../msw/handlers"
import { createTestQueryClient } from "../../helpers/render"

const files = import.meta.glob("../../../src/lib/i18n/locales/*/*.json", {
  eager: true,
})

const resources: I18nResources = {}

for (const path in files) {
  const match = path.match(/\/locales\/([^/]+)\/(.+)\.json$/)
  if (!match) continue
  const [, language, namespace] = match
  resources[language] ??= {}
  resources[language][namespace] = (files[path] as { default: ResourceKey })
    .default
}

async function buildDetectingInstance() {
  const instance = createInstance()
  await instance
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
  return instance
}

afterEach(async () => {
  localStorage.clear()
  await appI18n.changeLanguage("en")
})

describe("i18n configuration", () => {
  describe("returning user restoration", () => {
    beforeEach(() => localStorage.clear())

    it("restores the previously selected language from localStorage", async () => {
      localStorage.setItem("i18nextLng", "es")

      const instance = await buildDetectingInstance()

      expect(instance.language).toBe("es")
      expect(instance.t("common:nav.events")).toBe("Eventos")
    })

    it("restores English when that was the stored choice", async () => {
      localStorage.setItem("i18nextLng", "en")

      const instance = await buildDetectingInstance()

      expect(instance.language).toBe("en")
      expect(instance.t("common:nav.events")).toBe("Events")
    })
  })

  describe("invalid stored language", () => {
    beforeEach(() => localStorage.clear())

    it("falls back to Spanish when the stored value is unsupported", async () => {
      localStorage.setItem("i18nextLng", "fr")

      const instance = await buildDetectingInstance()

      expect(instance.resolvedLanguage).toBe("es")
      expect(instance.t("common:nav.events")).toBe("Eventos")
    })
  })

  describe("missing-key fallback", () => {
    let instance: I18nInstance

    beforeEach(async () => {
      instance = await buildDetectingInstance()
      await instance.changeLanguage("en")
    })

    it("falls back to the Spanish value when an English key is missing", async () => {
      instance.addResource("es", "common", "onlyInSpanish", "Solo en español")

      expect(instance.t("common:onlyInSpanish")).toBe("Solo en español")
    })

    it("still prefers the English value when the key exists in English", () => {
      expect(instance.t("common:nav.events")).toBe("Events")
    })
  })

  describe("Spanish smoke renders", () => {
    function renderWithProvider(node: ReactNode) {
      return render(
        <QueryClientProvider client={createTestQueryClient()}>
          <I18nextProvider i18n={appI18n}>
            <MemoryRouter>{node}</MemoryRouter>
          </I18nextProvider>
        </QueryClientProvider>,
      )
    }

    beforeEach(async () => {
      await appI18n.changeLanguage("es")
    })

    it("renders the login screen in Spanish", async () => {
      server.use(meUnauthenticated())
      renderWithProvider(<LoginPage />)

      expect(
        await screen.findByText("Inicia sesión en la Forja"),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: "Iniciar sesión" }),
      ).toBeInTheDocument()
      expect(screen.getByText("Correo electrónico")).toBeInTheDocument()
    })

    it("renders the forbidden screen in Spanish", () => {
      renderWithProvider(<ForbiddenPage />)

      expect(screen.getByText("Acceso denegado")).toBeInTheDocument()
      expect(
        screen.getByText("No tienes permiso para ver esta página."),
      ).toBeInTheDocument()
    })
  })
})
