import messageApiRequest from '@/apiRequests/message'
import {
    AddReactionBodyType,
    CreateMessageBodyType,
    GetMessagesQueryParamsType,
    SearchMessagesQueryParamsType,
    UpdateMessageBodyType,
} from '@/schemaValidations/message.schema'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useGetMessagesQuery = (
  conversationId: number,
  queryParams?: GetMessagesQueryParamsType,
  enabled: boolean = true
) => {
  return useInfiniteQuery({
    queryKey: ['chat', 'messages', conversationId, queryParams],
    queryFn: async ({ pageParam }) => {
      const response = await messageApiRequest.getMessages(conversationId, {
        limit: queryParams?.limit || 50,
        before: pageParam,
      })
      return response.payload.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      // The backend returns messages in chronological order (oldest first).
      // The oldest message in the batch is at index 0.
      if (lastPage.messages && lastPage.messages.length > 0) {
        return lastPage.messages[0].createdAt
      }
      return undefined
    },
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
    onMutate: async ({ conversationId, body }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['chat', 'messages', conversationId] })

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<any>(['chat', 'messages', conversationId])

      // Optimistically update to the new value
      if (previousMessages) {
        const fakeMessage = {
          id: -Date.now(), // Temporary ID
          conversationId,
          senderId: 0, // Should be current user ID ideally, but server will fix it
          content: body.content,
          createdAt: new Date().toISOString(),
          replyToId: body.replyToId,
          replyTo: null, // Would need to look this up if we want full optimism
          attachments: [],
          reactions: [],
          readReceipts: [],
          isEdited: false,
          isDeleted: false,
        }

        // We use setQueriesData to update all queries that start with this key
        queryClient.setQueriesData({ queryKey: ['chat', 'messages', conversationId] }, (old: any) => {
          if (!old?.pages) return old // If not infinite query structure, return
          
          const newPages = [...old.pages]
          if (newPages.length > 0) {
            // Check if the message is already added (e.g. from socket)
            const alreadyExists = newPages[0].messages?.some((m: any) => m.id === fakeMessage.id || (m.id < 0 && m.content === fakeMessage.content))
            if (alreadyExists) return old

            newPages[0] = {
              ...newPages[0],
              // Add to the end since messages are sorted asc (chronological)
              messages: [...(newPages[0].messages || []), fakeMessage]
            }
          }
          
          return {
            ...old,
            pages: newPages
          }
        })
      }

      // Return a context object with the snapshotted value
      return { previousMessages, conversationId }
    },
    onError: (err, newTodo, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat', 'messages', context.conversationId], context.previousMessages)
      }
    },
    onSettled: (data, error, variables, context) => {
      // Always refetch after error or success to ensure we have the real ID from the server
      if (context?.conversationId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'messages', context.conversationId] })
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      }
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
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['chat', 'messages'] })
      
      // We could ideally optimistic-delete the message here by traversing all conversation caches
      // However, because we don't have the conversationId here easily, we will just rely on invalidation for now.
    },
    onSettled: (_, error, id) => {
      // Invalidate all message queries
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
    onMutate: async ({ id, emoji }) => {
      // Optimistic update for reaction
      // We don't know the exact conversationId here, so we might need to invalidate or search cache
      // A more robust approach requires passing conversationId, but we'll stick to invalidation for now
      // and let the socket handle real-time updates to avoid complex cache traversal
      await queryClient.cancelQueries({ queryKey: ['chat', 'messages'] })
    },
    onSettled: (data, error, variables) => {
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
