import {
  COUNTDOWN_PAD_LENGTH,
  MS_PER_DAY,
  MS_PER_HOUR,
  MS_PER_MINUTE,
  MS_PER_SECOND,
} from "@/features/invitation-flow/constants/countdown.constants"

export function remainingMsUntil(startIso: string, nowMs: number): number {
  return Math.max(0, new Date(startIso).getTime() - nowMs)
}

export function formatCountdown(remainingMs: number): string {
  const clamped = Math.max(0, remainingMs)
  const days = Math.floor(clamped / MS_PER_DAY)
  const hours = Math.floor((clamped % MS_PER_DAY) / MS_PER_HOUR)
  const minutes = Math.floor((clamped % MS_PER_HOUR) / MS_PER_MINUTE)
  const seconds = Math.floor((clamped % MS_PER_MINUTE) / MS_PER_SECOND)

  return [days, hours, minutes, seconds]
    .map((value) => value.toString().padStart(COUNTDOWN_PAD_LENGTH, "0"))
    .join(":")
}
