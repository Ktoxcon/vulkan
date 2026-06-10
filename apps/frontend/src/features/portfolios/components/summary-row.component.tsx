type SummaryRowProps = {
  label: string
  value: string
}

export function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
