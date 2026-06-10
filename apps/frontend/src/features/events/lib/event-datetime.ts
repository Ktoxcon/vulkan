export function toLocalInputValue(iso?: string) {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

export function toIso(local: string) {
  if (!local) return undefined
  const date = new Date(local)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}
