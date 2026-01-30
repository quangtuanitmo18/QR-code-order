import { notificationService } from '@/services/notification.service'
import { Cron } from 'croner'

/**
 * Calendar Notification Background Job
 *
 * Runs every 15 minutes to check for upcoming events and create notifications:
 * - 1-hour reminders for events starting within 1 hour
 * - 1-day reminders for events starting tomorrow
 *
 * Cron pattern: every 15 minutes
 */
const calendarNotificationJob = () => {
  Cron('*/15 * * * *', async () => {
    try {
      const result = await notificationService.createNotificationsForUpcomingEvents()

      if (result.created > 0) {
        console.log(`[Calendar Notification Job] Created ${result.created} notification(s)`)
      }
    } catch (error) {
      console.error('[Calendar Notification Job] Error creating notifications:', error)
    }
  })

  console.log('[Calendar Notification Job] Scheduled to run every 15 minutes')
}

export default calendarNotificationJob
