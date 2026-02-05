import messageApiRequest from '@/apiRequests/message'
import {
  CreateMessageBodyType,
  GetMessagesQueryParamsType,
  UpdateMessageBodyType,
  AddReactionBodyType,
  SearchMessagesQueryParamsType,
} from '@/schemaValidations/message.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useGetMessagesQuery = (
  conversationId: number,
  queryParams?: GetMessagesQueryParamsType,
  enabled: boolean = true
) => {
  return useQuery({
    queryFn: () => messageApiRequest.getMessages(conversationId, queryParams),
    queryKey: ['chat', 'messages', conversationId, queryParams],
    enabled: enabled && !!conversationId,
  })
}

export const useGetMessageByIdQuery = ({ id, enabled }: { id: number; enabled: boolean }) => {
  return useQuery({
    queryFn: () => messageApiRequest.getMessageById(id),
    queryKey: ['chat', 'messages', 'detail', id],
    enabled,
  })
}

export const useSendMessageMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      conversationId,
      body,
      files,
    }: {
      conversationId: number
      body: CreateMessageBodyType
      files?: File[]
    }) => messageApiRequest.sendMessage(conversationId, body, files),
    onSuccess: (data, variables) => {
      // Invalidate messages for this conversation
      // Note: We don't optimistically add the message here because the socket event
      // will handle it. This avoids duplicate messages when both mutation and socket
      // try to add the same message to the cache.
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', variables.conversationId] })
      // Invalidate conversations list to update last message and timestamp
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
    },
  })
}

export const useEditMessageMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateMessageBodyType & { id: number }) =>
      messageApiRequest.editMessage(id, body),
    onSuccess: (data, variables) => {
      // Find conversationId from the message data
      const conversationId = data.payload.data.conversationId
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] })
      // Invalidate specific message
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', 'detail', variables.id] })
    },
  })
}

export const useDeleteMessageMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => messageApiRequest.deleteMessage(id),
    onSuccess: (_, id) => {
      // Invalidate all message queries (we don't know conversationId here)
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', 'detail', id] })
    },
  })
}

export const useMarkMessageAsReadMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => messageApiRequest.markMessageAsRead(id),
    onSuccess: (_, id) => {
      // Invalidate messages to update read receipts
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', 'detail', id] })
    },
  })
}

export const useAddReactionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: AddReactionBodyType & { id: number }) =>
      messageApiRequest.addReaction(id, body),
    onSuccess: (data, variables) => {
      // Find conversationId from the message (we need to get it from cache or API)
      // For now, invalidate all messages
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', 'detail', variables.id] })
    },
  })
}

export const useRemoveReactionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, emoji }: { id: number; emoji: string }) =>
      messageApiRequest.removeReaction(id, emoji),
    onSuccess: (_, variables) => {
      // Invalidate messages to update reactions
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', 'detail', variables.id] })
    },
  })
}

export const useSearchMessagesQuery = (
  queryParams: SearchMessagesQueryParamsType,
  enabled: boolean = true
) => {
  return useQuery({
    queryFn: () => messageApiRequest.searchMessages(queryParams),
    queryKey: ['chat', 'messages', 'search', queryParams],
    enabled: enabled && !!queryParams.q,
  })
}
