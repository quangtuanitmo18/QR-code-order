import prisma from '@/database'

export interface NotificationFilters {
  unreadOnly?: boolean
  notificationType?: string
}

export interface CreateNotificationData {
  eventId: number
  userId: number
  notificationType: string
  message: string
  scheduledFor: Date
}

export const notificationRepository = {
  // Find notifications for a user
  async findNotificationsByUser(userId: number, filters?: NotificationFilters) {
    return await prisma.calendarNotification.findMany({
      where: {
        userId,
        ...(filters?.unreadOnly && { isRead: false }),
        ...(filters?.notificationType && { notificationType: filters.notificationType })
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: [{ scheduledFor: 'desc' }, { createdAt: 'desc' }]
    })
  },

  // Find notifications scheduled for a specific time range (for background job)
  async findNotificationsByScheduledTime(startDate: Date, endDate: Date) {
    return await prisma.calendarNotification.findMany({
      where: {
        scheduledFor: {
          gte: startDate,
          lte: endDate
        },
        isRead: false
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        scheduledFor: 'asc'
      }
    })
  },

  // Find unread notifications count for a user
  async getUnreadCount(userId: number) {
    return await prisma.calendarNotification.count({
      where: {
        userId,
        isRead: false
      }
    })
  },

  // Create notification
  async createNotification(data: CreateNotificationData) {
    return await prisma.calendarNotification.create({
      data,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true
          }
        }
      }
    })
  },

  // Create multiple notifications (bulk insert)
  async createNotifications(notifications: CreateNotificationData[]) {
    if (notifications.length === 0) {
      return []
    }

    return await prisma.$transaction(
      notifications.map((notification) =>
        prisma.calendarNotification.create({
          data: notification,
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true
              }
            }
          }
        })
      )
    )
  },

  // Mark notification as read
  async markAsRead(notificationId: number, userId: number) {
    return await prisma.calendarNotification.updateMany({
      where: {
        id: notificationId,
        userId // Ensure user can only mark their own notifications as read
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: number) {
    return await prisma.calendarNotification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })
  },

  // Delete notification
  async deleteNotification(notificationId: number) {
    return await prisma.calendarNotification.delete({
      where: {
        id: notificationId
      }
    })
  },

  // Delete notifications by event ID (when event is deleted)
  async deleteNotificationsByEventId(eventId: number) {
    return await prisma.calendarNotification.deleteMany({
      where: {
        eventId
      }
    })
  },

  // Delete old read notifications (cleanup job)
  async deleteOldReadNotifications(beforeDate: Date) {
    return await prisma.calendarNotification.deleteMany({
      where: {
        isRead: true,
        readAt: {
          lte: beforeDate
        }
      }
    })
  }
}
