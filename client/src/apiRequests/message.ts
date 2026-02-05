import http from '@/lib/http'
import {
  CreateMessageBodyType,
  CreateMessageResType,
  UpdateMessageBodyType,
  UpdateMessageResType,
  DeleteMessageResType,
  GetMessagesQueryParamsType,
  GetMessagesResType,
  GetMessageResType,
  MarkMessageAsReadResType,
  AddReactionBodyType,
  AddReactionResType,
  RemoveReactionResType,
  SearchMessagesQueryParamsType,
  SearchMessagesResType,
} from '@/schemaValidations/message.schema'

export const messageApiRequest = {
  getMessages: (conversationId: number, queryParams?: GetMessagesQueryParamsType) =>
    http.get<GetMessagesResType>(`/chat/conversations/${conversationId}/messages`, {
      params: queryParams,
    }),

  getMessageById: (id: number) => http.get<GetMessageResType>(`/chat/messages/${id}`),

  sendMessage: (conversationId: number, body: CreateMessageBodyType, files?: File[]) => {
    const formData = new FormData()
    formData.append('content', body.content)
    if (body.replyToId) {
      formData.append('replyToId', body.replyToId.toString())
    }
    // Append files if provided
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('file', file)
      })
    }
    // Don't set Content-Type header - browser will set it automatically with boundary
    return http.post<CreateMessageResType>(
      `/chat/conversations/${conversationId}/messages`,
      formData
    )
  },

  editMessage: (id: number, body: UpdateMessageBodyType) =>
    http.put<UpdateMessageResType>(`/chat/messages/${id}`, body),

  deleteMessage: (id: number) => http.delete<DeleteMessageResType>(`/chat/messages/${id}`),

  markMessageAsRead: (id: number) =>
    http.post<MarkMessageAsReadResType>(`/chat/messages/${id}/read`),

  addReaction: (id: number, body: AddReactionBodyType) =>
    http.post<AddReactionResType>(`/chat/messages/${id}/reactions`, body),

  removeReaction: (id: number, emoji: string) =>
    http.delete<RemoveReactionResType>(
      `/chat/messages/${id}/reactions/${encodeURIComponent(emoji)}`
    ),

  searchMessages: (queryParams: SearchMessagesQueryParamsType) =>
    http.get<SearchMessagesResType>('/chat/search', {
      params: queryParams,
    }),
}

export default messageApiRequest
