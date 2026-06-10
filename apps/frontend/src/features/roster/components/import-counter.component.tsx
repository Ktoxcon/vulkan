type ImportCounterProps = {
  label: string
  value: number
}

export function ImportCounter({ label, value }: ImportCounterProps) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}
