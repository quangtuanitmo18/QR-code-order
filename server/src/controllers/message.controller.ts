import {
  CreateMessageBodyType,
  UpdateMessageBodyType,
  GetMessagesQueryParamsType,
  ConversationIdParamForMessagesType,
  MessageIdParamType,
  AddReactionBodyType,
  EmojiParamType,
  SearchMessagesQueryParamsType
} from '@/schemaValidations/message.schema'
import { messageService } from '@/services/message.service'

export const getMessagesController = async (
  conversationId: number,
  accountId: number,
  query: GetMessagesQueryParamsType
) => {
  return await messageService.getMessages({
    conversationId,
    accountId,
    before: query.before,
    limit: query.limit
  })
}

export const getMessageByIdController = async (id: number, accountId: number) => {
  return await messageService.getMessageById(id, accountId)
}

export const sendMessageController = async (
  conversationId: number,
  accountId: number,
  body: { content: string; replyToId: number | null },
  files?: any[]
) => {
  return await messageService.sendMessage({
    conversationId,
    senderId: accountId,
    content: body.content,
    replyToId: body.replyToId,
    files: files || []
  })
}

export const editMessageController = async (id: number, accountId: number, body: UpdateMessageBodyType) => {
  return await messageService.editMessage(id, accountId, body.content)
}

export const deleteMessageController = async (id: number, accountId: number) => {
  return await messageService.deleteMessage(id, accountId)
}

export const markMessageAsReadController = async (messageId: number, accountId: number) => {
  return await messageService.markMessageAsRead(messageId, accountId)
}

export const addReactionController = async (messageId: number, accountId: number, body: AddReactionBodyType) => {
  return await messageService.addReaction(messageId, accountId, body.emoji)
}

export const removeReactionController = async (messageId: number, accountId: number, emoji: string) => {
  return await messageService.removeReaction(messageId, accountId, emoji)
}

export const searchMessagesController = async (accountId: number, query: SearchMessagesQueryParamsType) => {
  return await messageService.searchMessages({
    accountId,
    query: query.q,
    conversationId: query.conversationId,
    page: query.page,
    limit: query.limit
  })
}
