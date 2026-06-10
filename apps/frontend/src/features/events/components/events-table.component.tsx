import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EventStatusBadge } from "@/features/events/components/event-status-badge.component"
import type { SalesEvent } from "@/features/events/types/event.types"
import { formatDate } from "@/lib/formatters/date.formatter"
import { SHORT_DATE } from "@/lib/formatters/date.formatter.constants"

type EventsTableProps = { events: SalesEvent[] }

export function EventsTable({ events }: EventsTableProps) {
  const navigate = useNavigate()
  const { t } = useTranslation("events")

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.name")}</TableHead>
          <TableHead>{t("table.status")}</TableHead>
          <TableHead>{t("table.capacity")}</TableHead>
          <TableHead className="hidden md:table-cell">{t("table.eventDate")}</TableHead>
          <TableHead className="hidden md:table-cell">{t("table.created")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="py-8 text-center text-muted-foreground"
            >
              {t("table.empty")}
            </TableCell>
          </TableRow>
        ) : (
          events.map((event) => (
            <TableRow
              key={event.id}
              className="cursor-pointer"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <TableCell className="font-medium">{event.name}</TableCell>
              <TableCell>
                <EventStatusBadge status={event.status} />
              </TableCell>
              <TableCell>{event.capacity}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {event.eventEndDate
                  ? `${formatDate(event.eventStartDate, SHORT_DATE)} – ${formatDate(event.eventEndDate, SHORT_DATE)}`
                  : formatDate(event.eventStartDate, SHORT_DATE)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatDate(event.createdAt, SHORT_DATE)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
