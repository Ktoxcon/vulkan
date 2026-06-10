import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useCreateRosterImport } from "@/features/roster/hooks/roster-import.hook"
import {
  ACCEPTED_FILE_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  MAX_ROSTER_FILE_SIZE,
} from "@/features/roster/constants/roster.constants"
import type { ImportRecord } from "@/features/roster/types/roster.types"
import { resolveError } from "@/lib/errors/resolve-error"

type RosterUploadProps = {
  eventId: string
  onImported: (record: ImportRecord) => void
}

export function RosterUpload({ eventId, onImported }: RosterUploadProps) {
  const { t } = useTranslation("roster")
  const inputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<File | null>(null)
  const createImport = useCreateRosterImport(eventId)

  const onSelect = (file: File | null) => {
    if (!file) {
      setSelected(null)
      return
    }
    const name = file.name.toLowerCase()
    const extensionOk = ACCEPTED_FILE_EXTENSIONS.some((ext) => name.endsWith(ext))
    const mimeOk =
      file.type === "" || ACCEPTED_MIME_TYPES.includes(file.type as never)
    const error =
      !extensionOk && !mimeOk
        ? t("upload.invalidType")
        : file.size > MAX_ROSTER_FILE_SIZE
          ? t("upload.tooLarge")
          : null
    if (error) {
      toast.error(error)
      setSelected(null)
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    setSelected(file)
  }

  const upload = () => {
    if (!selected) return
    createImport.mutate(selected, {
      onSuccess: (record) => {
        setSelected(null)
        if (inputRef.current) inputRef.current.value = ""
        onImported(record)
      },
      onError: (error) => toast.error(resolveError(error)),
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          {t("upload.title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("upload.description")}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="block w-full text-sm text-foreground file:mr-4 file:rounded-md file:border file:border-border file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground"
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
      />
      {selected ? (
        <p className="truncate text-sm text-muted-foreground">
          {t("upload.selected", { name: selected.name })}
        </p>
      ) : null}
      <Button
        className="h-11 w-full sm:w-auto"
        onClick={upload}
        disabled={!selected || createImport.isPending}
      >
        {createImport.isPending ? <Loader2 className="animate-spin" /> : <Upload />}
        {t("upload.submit")}
      </Button>
    </div>
  )
}
