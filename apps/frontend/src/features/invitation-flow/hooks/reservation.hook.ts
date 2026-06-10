import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { InvitationFlowClient } from "@/lib/clients/invitation-flow.client"
import type { ReservationView } from "@/features/invitation-flow/types/invitation-flow.types"

export function useCreateReservation(token: string) {
  return useMutation<ReservationView, Error, void>({
    mutationFn: () => InvitationFlowClient.createReservation(token),
  })
}

type ReservationCountdown = {
  remainingMs: number
  remainingSeconds: number
  isExpired: boolean
}

function computeCountdown(expiresAt: string | null): ReservationCountdown {
  if (!expiresAt) {
    return { remainingMs: 0, remainingSeconds: 0, isExpired: false }
  }
  const remainingMs = Math.max(0, new Date(expiresAt).getTime() - Date.now())
  return {
    remainingMs,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    isExpired: remainingMs <= 0,
  }
}

export function useReservationCountdown(expiresAt: string | null): ReservationCountdown {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!expiresAt) return
    const interval = window.setInterval(() => {
      setTick((value) => value + 1)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [expiresAt])

  return computeCountdown(expiresAt)
}
