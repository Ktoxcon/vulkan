import type { UserRole } from "@/features/auth/types/auth.types"

export const Routes = {
  login: "/login",
  home: "/",
  admin: "/admin",
  sales: "/sales",
  users: "/users",
  usersNew: "/users/new",
  userEdit: "/users/:id",
  events: "/events",
  eventsNew: "/events/new",
  eventDetail: "/events/:eventId",
  eventEdit: "/events/:eventId/edit",
  catalog: "/catalog",
  catalogNew: "/catalog/new",
  catalogEdit: "/catalog/:offeringId",
  catalogImport: "/catalog/import",
  invitation: "/invitation/:token",
  portfolioDetail: "/portfolios/:portfolioId",
  forbidden: "/403",
} as const

export const landingByRole: Record<UserRole, string> = {
  admin: Routes.admin,
  sales: Routes.sales,
}
