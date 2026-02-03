'use client'

import { useState } from 'react'
import {
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} from '@/queries/useTaskComment'
import { TaskCommentType } from '@/schemaValidations/task-comment.schema'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import { format } from 'date-fns'
import { MessageSquare, Edit, Trash2, Send, X } from 'lucide-react'
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

interface TaskCommentsProps {
  taskId: number
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)

  const { data: currentUser } = useAccountMe()
  const currentUserId = currentUser?.payload.data.id

  const { data, isLoading } = useGetCommentsQuery(taskId, true)
  const createMutation = useCreateCommentMutation()
  const updateMutation = useUpdateCommentMutation()
  const deleteMutation = useDeleteCommentMutation()

  const comments = data?.payload.data || []

  const handleCreateComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: 'Error',
        description: 'Comment cannot be empty',
        variant: 'destructive',
      })
      return
    }

    try {
      await createMutation.mutateAsync({
        taskId,
        content: newComment.trim(),
      })
      setNewComment('')
      toast({
        title: 'Success',
        description: 'Comment added successfully',
      })
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const handleStartEdit = (comment: TaskCommentType) => {
    setEditingCommentId(comment.id)
    setEditingContent(comment.content)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditingContent('')
  }

  const handleUpdateComment = async (commentId: number) => {
    if (!editingContent.trim()) {
      toast({
        title: 'Error',
        description: 'Comment cannot be empty',
        variant: 'destructive',
      })
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: commentId,
        taskId,
        content: editingContent.trim(),
      })
      setEditingCommentId(null)
      setEditingContent('')
      toast({
        title: 'Success',
        description: 'Comment updated successfully',
      })
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const handleDeleteComment = async () => {
    if (!deletingCommentId) return

    try {
      await deleteMutation.mutateAsync({
        id: deletingCommentId,
        taskId,
      })
      setDeletingCommentId(null)
      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
      })
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading comments...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
      </div>

      {/* Add Comment Form */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleCreateComment}
            disabled={!newComment.trim() || createMutation.isPending}
            size="sm"
          >
            <Send className="mr-2 h-4 w-4" />
            {createMutation.isPending ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-2 rounded-lg border p-4">
              {editingCommentId === comment.id ? (
                // Edit Mode
                <div className="space-y-2">
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateComment(comment.id)}
                      disabled={!editingContent.trim() || updateMutation.isPending}
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-medium">{comment.createdBy.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                        {comment.updatedAt.getTime() !== comment.createdAt.getTime() && (
                          <span className="text-xs text-muted-foreground">(edited)</span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
                    </div>
                    {currentUserId === comment.createdById && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleStartEdit(comment)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingCommentId(comment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCommentId} onOpenChange={() => setDeletingCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
