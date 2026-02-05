import http from '@/lib/http'
import {
  CreateConversationBodyType,
  CreateConversationResType,
  DeleteConversationResType,
  GetConversationResType,
  GetConversationsQueryParamsType,
  GetConversationsResType,
  UpdateConversationBodyType,
  UpdateConversationResType,
  AddParticipantsBodyType,
  AddParticipantsResType,
  RemoveParticipantResType,
  PinConversationResType,
  MuteConversationResType,
} from '@/schemaValidations/chat.schema'

export const chatApiRequest = {
  getConversations: (queryParams?: GetConversationsQueryParamsType) =>
    http.get<GetConversationsResType>('/chat/conversations', {
      params: queryParams,
    }),

  getConversationById: (id: number) =>
    http.get<GetConversationResType>(`/chat/conversations/${id}`),

  createConversation: (body: CreateConversationBodyType) =>
    http.post<CreateConversationResType>('/chat/conversations', body),

  updateConversation: (id: number, body: UpdateConversationBodyType) =>
    http.put<UpdateConversationResType>(`/chat/conversations/${id}`, body),

  deleteConversation: (id: number) =>
    http.delete<DeleteConversationResType>(`/chat/conversations/${id}`),

  addParticipants: (id: number, body: AddParticipantsBodyType) =>
    http.post<AddParticipantsResType>(`/chat/conversations/${id}/participants`, body),

  removeParticipant: (id: number, accountId: number) =>
    http.delete<RemoveParticipantResType>(`/chat/conversations/${id}/participants/${accountId}`),

  pinConversation: (id: number) =>
    http.post<PinConversationResType>(`/chat/conversations/${id}/pin`, {}),

  unpinConversation: (id: number) =>
    http.delete<PinConversationResType>(`/chat/conversations/${id}/pin`),

  muteConversation: (id: number) =>
    http.post<MuteConversationResType>(`/chat/conversations/${id}/mute`, {}),

  unmuteConversation: (id: number) =>
    http.delete<MuteConversationResType>(`/chat/conversations/${id}/mute`),
}

export default chatApiRequest
