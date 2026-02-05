'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
// ScrollArea not available, using div with overflow
import { useAppStore } from '@/components/app-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/components/ui/use-toast'
import { Role } from '@/constants/type'
import { handleErrorApi } from '@/lib/utils'
import { useAccountMe, useGetAccountList } from '@/queries/useAccount'
import { useCreateConversationMutation } from '@/queries/useChat'

const createConversationSchema = z.object({
  type: z.enum(['direct', 'group']),
  name: z.string().min(1).max(100).optional().nullable(),
})

type CreateConversationFormData = z.infer<typeof createConversationSchema>

interface CreateConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (conversationId: number) => void
}

export function CreateConversationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateConversationDialogProps) {
  const role = useAppStore((state) => state.role)
  const isOwner = role === Role.Owner

  const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>([])
  const [conversationType, setConversationType] = useState<'direct' | 'group'>('direct')

  const createMutation = useCreateConversationMutation()
  const accountsQuery = useGetAccountList()
  const currentUserQuery = useAccountMe()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateConversationFormData>({
    resolver: zodResolver(createConversationSchema),
    defaultValues: {
      type: 'direct',
      name: null,
    },
  })

  // Get available accounts (Owner and Employee only, exclude current user)
  const currentUserId = currentUserQuery.data?.payload.data.id
  const availableAccounts =
    accountsQuery.data?.payload.data.filter(
      (account) =>
        (account.role === Role.Owner || account.role === Role.Employee) &&
        account.id !== currentUserId
    ) || []

  const onSubmit = async (data: CreateConversationFormData) => {
    try {
      // Ensure at least one participant is selected
      if (selectedParticipantIds.length === 0) {
        toast({
          description: 'Please select at least one participant',
          variant: 'destructive',
        })
        return
      }

      const result = await createMutation.mutateAsync({
        type: data.type,
        name: data.type === 'group' ? data.name || undefined : undefined,
        participantIds: selectedParticipantIds,
      })

      toast({
        description:
          data.type === 'group'
            ? 'Group chat created successfully'
            : 'Conversation created successfully',
      })

      reset()
      setSelectedParticipantIds([])
      setConversationType('direct')
      onOpenChange(false)

      if (onSuccess && result?.payload?.data?.id) {
        onSuccess(result.payload.data.id)
      }
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const handleParticipantToggle = (accountId: number) => {
    setSelectedParticipantIds((prev) => {
      const newSelection = prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]

      // For direct chat, only allow one participant
      if (conversationType === 'direct' && newSelection.length > 1) {
        return [accountId] // Replace with new selection
      }

      return newSelection
    })
  }

  const handleTypeChange = (type: 'direct' | 'group') => {
    setConversationType(type)
    setValue('type', type)
    // Reset participant selection when switching types
    if (type === 'direct' && selectedParticipantIds.length > 1) {
      setSelectedParticipantIds([selectedParticipantIds[0]])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Conversation</DialogTitle>
          <DialogDescription>
            {isOwner
              ? 'Create a direct chat or group chat with your team members'
              : 'Create a direct chat with another team member'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Conversation Type Selection (only for Owner) */}
          {isOwner && (
            <div className="space-y-2">
              <Label>Conversation Type</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={conversationType === 'direct' ? 'default' : 'outline'}
                  onClick={() => handleTypeChange('direct')}
                  className="flex-1"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Direct Chat
                </Button>
                <Button
                  type="button"
                  variant={conversationType === 'group' ? 'default' : 'outline'}
                  onClick={() => handleTypeChange('group')}
                  className="flex-1"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Group Chat
                </Button>
              </div>
              <input type="hidden" {...register('type')} />
            </div>
          )}

          {/* Group Name (only for group chats) */}
          {conversationType === 'group' && isOwner && (
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter group name"
                maxLength={100}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
          )}

          {/* Participant Selection */}
          <div className="space-y-2">
            <Label>
              Select Participants
              {conversationType === 'direct' && ' (Select 1 person)'}
              {conversationType === 'group' && ' (Select 1-49 people)'}
            </Label>
            <div className="h-[300px] overflow-y-auto rounded-md border p-4">
              {accountsQuery.isLoading ? (
                <div className="py-4 text-center text-muted-foreground">Loading accounts...</div>
              ) : availableAccounts.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">No accounts available</div>
              ) : (
                <div className="space-y-2">
                  {availableAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex cursor-pointer items-center space-x-3 rounded-lg p-2 hover:bg-accent"
                    >
                      <Checkbox
                        checked={selectedParticipantIds.includes(account.id)}
                        onCheckedChange={() => handleParticipantToggle(account.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={account.avatar || undefined} alt={account.name} />
                        <AvatarFallback>
                          {account.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{account.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Conversation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
