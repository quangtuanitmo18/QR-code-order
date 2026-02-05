import {
  CreateConversationBodyType,
  GetConversationsQueryParamsType,
  UpdateConversationBodyType,
  AddParticipantsBodyType,
  ConversationIdParamType,
  AccountIdParamType
} from '@/schemaValidations/chat.schema'
import { chatService } from '@/services/chat.service'

export const getConversationsController = async (accountId: number, query: GetConversationsQueryParamsType) => {
  return await chatService.getConversations({
    accountId,
    type: query.type,
    search: query.search,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder
  })
}

export const getConversationByIdController = async (id: number, accountId: number) => {
  return await chatService.getConversationById(id, accountId)
}

export const createConversationController = async (
  accountId: number,
  role: string,
  body: CreateConversationBodyType
) => {
  return await chatService.createConversation({
    type: body.type,
    name: body.name,
    avatar: body.avatar,
    createdById: accountId,
    participantIds: body.participantIds,
    creatorRole: role
  })
}

export const updateConversationController = async (id: number, accountId: number, body: UpdateConversationBodyType) => {
  return await chatService.updateConversation(id, accountId, {
    name: body.name,
    avatar: body.avatar
  })
}

export const deleteConversationController = async (id: number, accountId: number) => {
  return await chatService.deleteConversation(id, accountId)
}

export const addParticipantsController = async (
  conversationId: number,
  accountId: number,
  body: AddParticipantsBodyType
) => {
  const participants = await chatService.addParticipants(conversationId, accountId, body.participantIds)
  return { participants }
}

export const removeParticipantController = async (
  conversationId: number,
  accountId: number,
  targetAccountId: number
) => {
  return await chatService.removeParticipant(conversationId, accountId, targetAccountId)
}

export const pinConversationController = async (conversationId: number, accountId: number) => {
  return await chatService.pinConversation(conversationId, accountId)
}

export const unpinConversationController = async (conversationId: number, accountId: number) => {
  return await chatService.unpinConversation(conversationId, accountId)
}

export const muteConversationController = async (conversationId: number, accountId: number) => {
  return await chatService.muteConversation(conversationId, accountId)
}

export const unmuteConversationController = async (conversationId: number, accountId: number) => {
  return await chatService.unmuteConversation(conversationId, accountId)
}
