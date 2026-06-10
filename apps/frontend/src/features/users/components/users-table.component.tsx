import { useTranslation } from "react-i18next"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserStatusBadge } from "@/features/users/components/user-status-badge.component"
import { UserRowActions } from "@/features/users/components/user-row-actions.component"
import { roleOptions } from "@/features/users/constants/user.constants"
import type { User } from "@/features/users/types/user.types"
import { useAuth } from "@/features/auth/hooks/auth.hook"
import { formatDate } from "@/lib/formatters/date.formatter"
import { SHORT_DATE } from "@/lib/formatters/date.formatter.constants"

type UsersTableProps = {
  users: User[]
}

export function UsersTable({ users }: UsersTableProps) {
  const { t } = useTranslation("users")
  const { user: currentUser } = useAuth()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.name")}</TableHead>
          <TableHead>{t("table.email")}</TableHead>
          <TableHead>{t("table.role")}</TableHead>
          <TableHead>{t("table.status")}</TableHead>
          <TableHead className="hidden md:table-cell">{t("table.created")}</TableHead>
          <TableHead className="text-right">{t("table.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="py-8 text-center text-muted-foreground"
            >
              {t("table.empty")}
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.name} {user.lastName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {user.email}
              </TableCell>
              <TableCell>
                {(() => {
                  const option = roleOptions.find(
                    (item) => item.value === user.role
                  )
                  return option ? t(option.label) : user.role
                })()}
              </TableCell>
              <TableCell>
                <UserStatusBadge status={user.status} />
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatDate(user.createdAt, SHORT_DATE)}
              </TableCell>
              <TableCell>
                <UserRowActions
                  user={user}
                  isSelf={currentUser?.id === user.id}
                />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
