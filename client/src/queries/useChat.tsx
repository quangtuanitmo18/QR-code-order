import chatApiRequest from '@/apiRequests/chat'
import {
  CreateConversationBodyType,
  GetConversationsQueryParamsType,
  UpdateConversationBodyType,
  AddParticipantsBodyType,
} from '@/schemaValidations/chat.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useGetConversationsQuery = (queryParams?: GetConversationsQueryParamsType) => {
  return useQuery({
    queryFn: () => chatApiRequest.getConversations(queryParams),
    queryKey: ['chat', 'conversations', queryParams],
  })
}

export const useGetConversationByIdQuery = ({ id, enabled }: { id: number; enabled: boolean }) => {
  return useQuery({
    queryFn: () => chatApiRequest.getConversationById(id),
    queryKey: ['chat', 'conversations', id],
    enabled,
  })
}

export const useCreateConversationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateConversationBodyType) => chatApiRequest.createConversation(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
    },
  })
}

export const useUpdateConversationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateConversationBodyType & { id: number }) =>
      chatApiRequest.updateConversation(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', variables.id] })
    },
  })
}

export const useDeleteConversationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => chatApiRequest.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
    },
  })
}

export const useAddParticipantsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: AddParticipantsBodyType & { id: number }) =>
      chatApiRequest.addParticipants(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', variables.id] })
    },
  })
}

export const useRemoveParticipantMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, accountId }: { id: number; accountId: number }) =>
      chatApiRequest.removeParticipant(id, accountId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', variables.id] })
    },
  })
}

export const usePinConversationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => chatApiRequest.pinConversation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', id] })
    },
  })
}

export const useUnpinConversationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => chatApiRequest.unpinConversation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', id] })
    },
  })
}

export const useMuteConversationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => chatApiRequest.muteConversation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', id] })
    },
  })
}

export const useUnmuteConversationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => chatApiRequest.unmuteConversation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', id] })
    },
  })
}
