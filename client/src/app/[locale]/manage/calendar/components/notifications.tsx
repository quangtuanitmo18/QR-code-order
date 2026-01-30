'use client'

import { Bell, Check, CheckCheck, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
// ScrollArea not available, using div with overflow instead
import { CalendarNotificationType } from '@/schemaValidations/calendar.schema'
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from '@/queries/useCalendar'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function CalendarNotifications() {
  const notificationsQuery = useGetNotificationsQuery({ unreadOnly: false })
  const markAsReadMutation = useMarkNotificationAsReadMutation()
  const markAllAsReadMutation = useMarkAllNotificationsAsReadMutation()

  const notifications = notificationsQuery.data?.payload.data.notifications || []
  const unreadCount = notificationsQuery.data?.payload.data.unreadCount || 0

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId)
      notificationsQuery.refetch()
      toast({
        title: 'Success',
        description: 'Notification marked as read',
      })
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync()
      notificationsQuery.refetch()
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      })
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return '⏰'
      case 'new_event':
        return '✨'
      case 'updated_event':
        return '📝'
      case 'cancelled_event':
        return '❌'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'reminder':
        return 'text-blue-600'
      case 'new_event':
        return 'text-green-600'
      case 'updated_event':
        return 'text-yellow-600'
      case 'cancelled_event':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Calendar Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
              <Bell className="mb-2 h-8 w-8 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  getNotificationIcon={getNotificationIcon}
                  getNotificationColor={getNotificationColor}
                />
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface NotificationItemProps {
  notification: CalendarNotificationType
  onMarkAsRead: (id: number) => void
  getNotificationIcon: (type: string) => string
  getNotificationColor: (type: string) => string
}

function NotificationItem({
  notification,
  onMarkAsRead,
  getNotificationIcon,
  getNotificationColor,
}: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent',
        !notification.isRead && 'bg-accent/50'
      )}
    >
      <div className={cn('text-lg', getNotificationColor(notification.notificationType))}>
        {getNotificationIcon(notification.notificationType)}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm', !notification.isRead && 'font-semibold')}>
            {notification.message}
          </p>
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => onMarkAsRead(notification.id)}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
        </div>
        {notification.event && (
          <p className="text-xs text-muted-foreground">Event: {notification.event.title}</p>
        )}
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
      {!notification.isRead && (
        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
      )}
    </div>
  )
}
