'use client'

import { SpinRewardType } from '@/schemaValidations/spin-reward.schema'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Edit, Trash2 } from 'lucide-react'
import { useDeleteSpinRewardMutation } from '@/queries/useSpinReward'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
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
      handleErrorApi(error)
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
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(reward)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingReward(reward)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
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
