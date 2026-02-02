'use client'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import { useDeleteSpinRewardMutation } from '@/queries/useSpinReward'
import { SpinRewardType } from '@/schemaValidations/spin-reward.schema'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface SpinRewardTableProps {
  rewards: SpinRewardType[]
  isLoading?: boolean
  onEdit: (reward: SpinRewardType) => void
}

export function SpinRewardTable({ rewards, isLoading = false, onEdit }: SpinRewardTableProps) {
  const [deletingReward, setDeletingReward] = useState<SpinRewardType | null>(null)
  const deleteMutation = useDeleteSpinRewardMutation()

  const handleDelete = async () => {
    if (!deletingReward) return

    try {
      await deleteMutation.mutateAsync(deletingReward.id)
      toast({
        title: 'Success',
        description: 'Reward deleted successfully',
      })
      setDeletingReward(null)
    } catch (error) {
      handleErrorApi({ error: error as any })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (rewards.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No rewards found. Create your first reward to get started.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Probability</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rewards.map((reward) => (
              <TableRow key={reward.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: reward.color || '#3b82f6' }}
                    />
                    {reward.name}
                  </div>
                </TableCell>
                <TableCell>
                  {reward.event ? (
                    <Badge variant="outline">{reward.event.name}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{reward.type}</Badge>
                </TableCell>
                <TableCell>{(reward.probability * 100).toFixed(1)}%</TableCell>
                <TableCell>
                  {reward.maxQuantity
                    ? `${reward.currentQuantity}/${reward.maxQuantity}`
                    : 'Unlimited'}
                </TableCell>
                <TableCell>
                  <Badge variant={reward.isActive ? 'default' : 'secondary'}>
                    {reward.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>{reward.order}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <DotsHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(reward)}>
                        <span className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Edit
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeletingReward(reward)}
                      >
                        <span className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deletingReward} onOpenChange={() => setDeletingReward(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reward</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingReward?.name}&quot;? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
