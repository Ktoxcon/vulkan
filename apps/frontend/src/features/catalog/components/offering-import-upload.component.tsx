import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type OfferingImportUploadProps = {
  pending: boolean
  onUpload: (file: File) => void
}

export function OfferingImportUpload({
  pending,
  onUpload,
}: OfferingImportUploadProps) {
  const { t } = useTranslation("catalog")
  const inputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<File | null>(null)

  const onSelect = (file: File | null) => {
    if (!file) {
      setSelected(null)
      return
    }
    const name = file.name.toLowerCase()
    const extensionOk = name.endsWith(".csv")
    const mimeOk = file.type === "" || file.type === "text/csv"
    if (!extensionOk && !mimeOk) {
      toast.error(t("import.upload.invalidFile"))
      setSelected(null)
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    setSelected(file)
  }

  const submit = () => {
    if (!selected) return
    onUpload(selected)
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{t("import.upload.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("import.upload.subtitle")}
        </p>
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
          {t("import.upload.selected", { name: selected.name })}
        </p>
      ) : null}
      <Button
        className="h-11 w-full sm:w-auto"
        onClick={submit}
        disabled={!selected || pending}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Upload />}
        {t("import.upload.submit")}
      </Button>
    </div>
  )
}
