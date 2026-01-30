import { GetNotificationsQueryParamsType } from '@/schemaValidations/calendar.schema'
import { notificationService } from '@/services/notification.service'

/**
 * Get notifications for the authenticated user
 */
export const getNotificationsController = async (userId: number, query: GetNotificationsQueryParamsType) => {
  return await notificationService.getUserNotifications(userId, query)
}

/**
 * Mark notification as read
 */
export const markNotificationAsReadController = async (notificationId: number, userId: number) => {
  return await notificationService.markNotificationAsRead(notificationId, userId)
}

/**
 * Mark all notifications as read for the authenticated user
 */
export const markAllNotificationsAsReadController = async (userId: number) => {
  return await notificationService.markAllNotificationsAsRead(userId)
}
