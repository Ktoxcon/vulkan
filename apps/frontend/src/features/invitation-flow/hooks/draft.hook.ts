import { useCallback, useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { InvitationFlowClient } from "@/lib/clients/invitation-flow.client"
import {
  DRAFT_DEBOUNCE_MS,
  invitationFlowQueryKey,
} from "@/features/invitation-flow/constants/invitation-flow.constants"
import { draftPartialSchema } from "@/features/invitation-flow/schemas/invitation-flow.schema"
import type {
  DraftView,
  FlowDraftData,
} from "@/features/invitation-flow/types/invitation-flow.types"

export function useDraft(token: string, hasDraft: boolean) {
  const query = useQuery<DraftView>({
    queryKey: [...invitationFlowQueryKey, token, "draft"],
    queryFn: () => InvitationFlowClient.getDraft(token),
    enabled: Boolean(token) && hasDraft,
    retry: false,
  })

  return {
    draft: query.data?.data ?? null,
    updatedAt: query.data?.updatedAt ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}

function toSchemaValidPartial(partial: FlowDraftData): FlowDraftData {
  const valid: FlowDraftData = {}

  for (const [key, value] of Object.entries(partial)) {
    if (value === undefined) continue
    const result = draftPartialSchema.safeParse({ [key]: value })
    if (result.success) Object.assign(valid, result.data)
  }

  return valid
}

export function useSaveDraft(token: string) {
  const queryClient = useQueryClient()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mutation = useMutation<DraftView, Error, FlowDraftData>({
    mutationFn: (data) => InvitationFlowClient.saveDraft(token, data),
    onSuccess: (view) => {
      queryClient.setQueryData([...invitationFlowQueryKey, token, "draft"], view)
    },
    onError: () => {},
  })

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const save = useCallback(
    (partial: FlowDraftData) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        const valid = toSchemaValidPartial(partial)
        if (Object.keys(valid).length === 0) return
        mutation.mutate(valid)
      }, DRAFT_DEBOUNCE_MS)
    },
    [mutation],
  )

  return {
    save,
    isSaving: mutation.isPending,
    savedAt: mutation.data?.updatedAt ?? null,
  }
}
