import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UsersTable } from "@/features/users/components/users-table.component"
import { useUsers } from "@/features/users/hooks/users.hook"

export function UsersPage() {
  const { t } = useTranslation("users")
  const {
    items,
    count,
    page,
    pageCount,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    isLoading,
    isError,
  } = useUsers()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">
            {t("list.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("list.subtitle")}
          </p>
        </div>
        <Button asChild className="h-11 w-full sm:w-auto">
          <Link to="/users/new">
            <Plus />
            {t("actions.create")}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" aria-label={t("list.loading")} />
        </div>
      ) : isError ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {t("list.error")}
        </p>
      ) : (
        <>
          <UsersTable users={items} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t("list.summary", { count, page: page + 1, pageCount })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-11 flex-1 sm:flex-none md:h-9"
                onClick={previousPage}
                disabled={!hasPreviousPage}
              >
                {t("list.previous")}
              </Button>
              <Button
                variant="outline"
                className="h-11 flex-1 sm:flex-none md:h-9"
                onClick={nextPage}
                disabled={!hasNextPage}
              >
                {t("list.next")}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
