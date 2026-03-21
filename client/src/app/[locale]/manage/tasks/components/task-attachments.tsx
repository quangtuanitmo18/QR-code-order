'use client'

import { useState, useRef } from 'react'
import {
  useGetAttachmentsQuery,
  useUploadAttachmentMutation,
  useDeleteAttachmentMutation,
} from '@/queries/useTaskAttachment'
import { TaskAttachmentType } from '@/schemaValidations/task-attachment.schema'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import { format } from 'date-fns'
import { Paperclip, Upload, Trash2, Download, File } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAccountMe } from '@/queries/useAccount'
import { useTranslations } from 'next-intl'

interface TaskAttachmentsProps {
  taskId: number
}

export function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const t = useTranslations('Tasks')
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: currentUser } = useAccountMe()
  const currentUserId = currentUser?.payload.data.id

  const { data, isLoading } = useGetAttachmentsQuery(taskId, true)
  const uploadMutation = useUploadAttachmentMutation()
  const deleteMutation = useDeleteAttachmentMutation()

  const attachments = data?.payload.data || []

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast({
        title: t('error'),
        description: t('fileSizeError'),
        variant: 'destructive',
      })
      return
    }

    try {
      await uploadMutation.mutateAsync({
        taskId,
        file,
      })
      toast({
        title: t('success'),
        description: t('fileUploaded'),
      })
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const handleDeleteAttachment = async () => {
    if (!deletingAttachmentId) return

    try {
      await deleteMutation.mutateAsync({
        id: deletingAttachmentId,
        taskId,
      })
      setDeletingAttachmentId(null)
      toast({
        title: t('success'),
        description: t('attachmentDeleted'),
      })
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">{t('loadingAttachments')}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{t('attachments')} ({attachments.length})</h3>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={uploadMutation.isPending}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            size="sm"
            variant="outline"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploadMutation.isPending ? t('uploading') : t('uploadFile')}
          </Button>
        </div>
      </div>

      {/* Attachments List */}
      <div className="space-y-2">
        {attachments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Paperclip className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>{t('noAttachments')}</p>
          </div>
        ) : (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <File className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-medium hover:underline"
                    >
                      {attachment.fileName}
                    </a>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(attachment.fileSize)}</span>
                    <span>•</span>
                    <span>{attachment.uploadedBy.name}</span>
                    <span>•</span>
                    <span>{format(new Date(attachment.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <a href={attachment.fileUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                {currentUserId === attachment.uploadedById && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingAttachmentId(attachment.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingAttachmentId} onOpenChange={() => setDeletingAttachmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteAttachment')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteAttachmentConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttachment}
              className="bg-destructive text-destructive-foreground"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
