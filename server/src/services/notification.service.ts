import { calendarRepository } from '@/repositories/calendar.repository'
import { notificationRepository } from '@/repositories/notification.repository'
import { GetNotificationsQueryParamsType, NotificationType } from '@/schemaValidations/calendar.schema'
import { EntityError } from '@/utils/errors'
import { addDays, addHours, subDays } from 'date-fns'

import prisma from '@/database'
import { messaging } from '@/lib/firebase-admin'

export interface FcmPayload {
  title: string
  body: string
  data?: {
    [key: string]: string
  }
}

export const notificationService = {
  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: number, query: GetNotificationsQueryParamsType) {
    const notifications = await notificationRepository.findNotificationsByUser(userId, {
      unreadOnly: query.unreadOnly,
      notificationType: undefined // Can add filter by type if needed
    })

    const unreadCount = await notificationRepository.getUnreadCount(userId)

    // Return notifications directly (serializerCompiler will handle Date serialization)
    return {
      notifications,
      unreadCount
    }
  },

  /**
   * Mark notification as read
   * @throws {EntityError} if notification not found or access denied
   */
  async markNotificationAsRead(notificationId: number, userId: number) {
    const result = await notificationRepository.markAsRead(notificationId, userId)

    if (result.count === 0) {
      throw new EntityError([{ field: 'id', message: 'Notification not found or access denied' }])
    }

    return { success: true }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(userId: number) {
    await notificationRepository.markAllAsRead(userId)
    return { success: true }
  },

  /**
   * Create notifications for upcoming events
   * This is called by the background job to generate notifications
   */
  async createNotificationsForUpcomingEvents() {
    const now = new Date()
    const oneHourFromNow = addHours(now, 1)
    const oneDayFromNow = addDays(now, 1)

    // Find events starting in the next hour (for immediate reminders)
    const eventsInOneHour = await calendarRepository.findEventsByDateRange(now, oneHourFromNow)

    // Find events starting in the next day (for day-before reminders)
    const eventsInOneDay = await calendarRepository.findEventsByDateRange(now, oneDayFromNow)

    const notificationsToCreate: Array<{
      eventId: number
      userId: number
      notificationType: string
      message: string
      scheduledFor: Date
    }> = []

    // Process events for 1-hour reminders
    for (const event of eventsInOneHour) {
      const eventStart = new Date(event.startDate)
      const timeUntilEvent = eventStart.getTime() - now.getTime()
      const hoursUntilEvent = timeUntilEvent / (1000 * 60 * 60)

      // Only create reminder if event starts within 1 hour
      if (hoursUntilEvent > 0 && hoursUntilEvent <= 1) {
        // Notify assigned employees
        if (event.assignments.length > 0) {
          for (const assignment of event.assignments) {
            // Check if notification already exists
            const existingNotifications = await notificationRepository.findNotificationsByUser(assignment.employeeId, {
              notificationType: NotificationType.REMINDER
            })

            // Check if 1-hour reminder already exists for this event
            const alreadyNotified = existingNotifications.some(
              (n) =>
                n.eventId === event.id &&
                n.notificationType === NotificationType.REMINDER &&
                n.scheduledFor.getTime() >= now.getTime() - 1000 * 60 * 15 // Within last 15 minutes (job runs every 15 min)
            )

            if (!alreadyNotified) {
              notificationsToCreate.push({
                eventId: event.id,
                userId: assignment.employeeId,
                notificationType: NotificationType.REMINDER,
                message: `Reminder: "${event.title}" starts in ${Math.round(hoursUntilEvent * 60)} minutes`,
                scheduledFor: now // Show immediately
              })
            }
          }
        } else {
          // Public event - notify all employees (we'll need to get all employees)
          // For now, skip public events for 1-hour reminders (can be added later)
        }
      }
    }

    // Process events for 1-day reminders
    for (const event of eventsInOneDay) {
      const eventStart = new Date(event.startDate)
      const timeUntilEvent = eventStart.getTime() - now.getTime()
      const daysUntilEvent = timeUntilEvent / (1000 * 60 * 60 * 24)

      // Only create reminder if event starts within 1 day but more than 1 hour
      if (daysUntilEvent > 1 / 24 && daysUntilEvent <= 1) {
        // Notify assigned employees
        if (event.assignments.length > 0) {
          for (const assignment of event.assignments) {
            // Check if notification already exists
            const existingNotifications = await notificationRepository.findNotificationsByUser(assignment.employeeId, {
              notificationType: NotificationType.REMINDER
            })

            // Check if 1-day reminder already exists for this event
            const oneDayBefore = subDays(eventStart, 1)
            const alreadyNotified = existingNotifications.some(
              (n) =>
                n.eventId === event.id &&
                n.notificationType === NotificationType.REMINDER &&
                Math.abs(n.scheduledFor.getTime() - oneDayBefore.getTime()) < 1000 * 60 * 60 // Within 1 hour of scheduled time
            )

            if (!alreadyNotified) {
              notificationsToCreate.push({
                eventId: event.id,
                userId: assignment.employeeId,
                notificationType: NotificationType.REMINDER,
                message: `Reminder: "${event.title}" starts tomorrow at ${eventStart.toLocaleTimeString()}`,
                scheduledFor: subDays(eventStart, 1) // Schedule for 1 day before
              })
            }
          }
        } else {
          // Public event - skip for now (can be added later)
        }
      }
    }

    // Create all notifications in bulk
    if (notificationsToCreate.length > 0) {
      await notificationRepository.createNotifications(notificationsToCreate)
    }

    return {
      created: notificationsToCreate.length
    }
  },

  /**
   * Create notification when event is created
   */
  async createEventCreatedNotifications(eventId: number, assignedUserIds: number[]) {
    const event = await calendarRepository.findEventById(eventId)

    const notificationsToCreate = assignedUserIds.map((userId) => ({
      eventId: event.id,
      userId,
      notificationType: NotificationType.NEW_EVENT,
      message: `New event: "${event.title}" has been scheduled`,
      scheduledFor: new Date() // Show immediately
    }))

    if (notificationsToCreate.length > 0) {
      await notificationRepository.createNotifications(notificationsToCreate)
    }

    return {
      created: notificationsToCreate.length
    }
  },

  /**
   * Create notification when event is updated
   */
  async createEventUpdatedNotifications(eventId: number, assignedUserIds: number[]) {
    const event = await calendarRepository.findEventById(eventId)

    const notificationsToCreate = assignedUserIds.map((userId) => ({
      eventId: event.id,
      userId,
      notificationType: NotificationType.UPDATED_EVENT,
      message: `Event updated: "${event.title}" has been modified`,
      scheduledFor: new Date() // Show immediately
    }))

    if (notificationsToCreate.length > 0) {
      await notificationRepository.createNotifications(notificationsToCreate)
    }

    return {
      created: notificationsToCreate.length
    }
  },

  /**
   * Create notification when event is cancelled
   * Note: Event is already deleted, so we pass event data instead of fetching
   */
  async createEventCancelledNotifications(eventId: number, assignedUserIds: number[], eventTitle: string) {
    const notificationsToCreate = assignedUserIds.map((userId) => ({
      eventId, // Event ID may still exist in DB for foreign key, but event record is deleted
      userId,
      notificationType: NotificationType.CANCELLED_EVENT,
      message: `Event cancelled: "${eventTitle}" has been cancelled`,
      scheduledFor: new Date() // Show immediately
    }))

    if (notificationsToCreate.length > 0) {
      await notificationRepository.createNotifications(notificationsToCreate)
    }

    return {
      created: notificationsToCreate.length
    }
  },

  /**
   * Send an FCM Notification to a specific account's registered devices.
   */
  async sendToAccount(accountId: number, payload: FcmPayload) {
    try {
      // 1. Fetch all tokens for this user
      const userTokens = await prisma.fcmToken.findMany({
        where: { accountId },
        select: { token: true }
      })

      if (userTokens.length === 0) {
        // User has no registered devices, fail silently
        return { success: false, reason: 'No registered FCM tokens' }
      }

      const tokens = userTokens.map((t: { token: string }) => t.token)

      // 2. Prepare the Firebase Multicast Message (Using Data-only to prevent FCM Web SDK from duplicating UI)
      const message = {
        tokens,
        data: {
          ...payload.data,
          title: payload.title,
          body: payload.body
        }
      }

      // 3. Send via Firebase Admin
      const response = await messaging.sendEachForMulticast(message)

      // 4. Cleanup invalid or expired tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = []
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            const errorCode = resp.error?.code
            // These error codes mean the token is dead/uninstalled/invalid
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              failedTokens.push(tokens[idx])
            }
          }
        })

        if (failedTokens.length > 0) {
          await this.cleanupTokens(failedTokens)
        }
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      }
    } catch (error) {
      console.error('[NotificationService.sendToAccount] Failed:', error)
      return { success: false, reason: 'Internal error' }
    }
  },

  /**
   * Send a silent data payload to an account (e.g. to dismiss a call rings)
   */
  async sendSilentDataToAccount(accountId: number, data: { [key: string]: string }) {
    try {
      const userTokens = await prisma.fcmToken.findMany({
        where: { accountId },
        select: { token: true }
      })

      if (userTokens.length === 0) return { success: false }

      const tokens = userTokens.map((t: { token: string }) => t.token)
      
      // No 'notification' object means it won't pop up on the OS level, 
      // but the Service Worker's onBackgroundMessage will still catch it.
      const message = {
        tokens,
        data
      }

      const response = await messaging.sendEachForMulticast(message)
      
      return { success: true, count: response.successCount }
    } catch (error) {
       console.error('[NotificationService.sendSilentDataToAccount] Failed:', error)
       return { success: false }
    }
  },

  /**
   * Internal Method to purge dead tokens from the DB
   */
  async cleanupTokens(invalidTokens: string[]) {
    try {
      await prisma.fcmToken.deleteMany({
        where: {
          token: { in: invalidTokens }
        }
      })
      console.log(`[NotificationService] Purged ${invalidTokens.length} dead FCM tokens.`)
    } catch (error) {
      console.error('[NotificationService.cleanupTokens] Failed:', error)
    }
  }
}
