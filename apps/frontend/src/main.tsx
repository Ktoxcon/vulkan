import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router"
import { I18nextProvider } from "react-i18next"
import i18n from "@/lib/i18n/i18n"
import { QueryProvider } from "@/lib/providers/query.provider"
import { router } from "@/app/app.router"
import { Toaster } from "@/components/ui/sonner"
import "@/index.css"

document.documentElement.classList.add("dark")

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryProvider>
        <RouterProvider router={router} />
        <Toaster />
      </QueryProvider>
    </I18nextProvider>
  </StrictMode>,
)
