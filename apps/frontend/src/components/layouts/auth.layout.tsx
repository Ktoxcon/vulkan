import { Suspense } from "react"
import { Outlet } from "react-router"
import { LanguageSelector } from "@/components/language-selector.component"
import { RouteFallback } from "@/components/route-fallback.component"

export function AuthLayout() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background p-6 text-foreground">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LanguageSelector />
      </div>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </main>
  )
}
