'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useEditMessageMutation } from '@/queries/useMessage'
import { handleErrorApi } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

const editMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message cannot exceed 5000 characters'),
})

type EditMessageFormData = z.infer<typeof editMessageSchema>

interface EditMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messageId: number | null
  currentContent: string
  onSuccess?: () => void
}

export function EditMessageDialog({
  open,
  onOpenChange,
  messageId,
  currentContent,
  onSuccess,
}: EditMessageDialogProps) {
  const editMutation = useEditMessageMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EditMessageFormData>({
    resolver: zodResolver(editMessageSchema),
    defaultValues: {
      content: currentContent,
    },
  })

  // Update form when currentContent changes
  useEffect(() => {
    if (open && currentContent) {
      setValue('content', currentContent)
    }
  }, [open, currentContent, setValue])

  const onSubmit = async (data: EditMessageFormData) => {
    if (!messageId) return

    try {
      await editMutation.mutateAsync({
        id: messageId,
        content: data.content,
      })

      toast({
        description: 'Message updated successfully',
      })

      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
          <DialogDescription>Update your message content</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              {...register('content')}
              placeholder="Enter message..."
              className="min-h-[100px]"
              maxLength={5000}
            />
            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
            <p className="text-right text-xs text-muted-foreground">
              {watch('content')?.length || 0} / 5000 characters
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={editMutation.isPending}>
              {editMutation.isPending ? 'Updating...' : 'Update Message'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
