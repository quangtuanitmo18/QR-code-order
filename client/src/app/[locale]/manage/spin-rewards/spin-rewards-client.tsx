'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useGetSpinRewardsQuery } from '@/queries/useSpinReward'
import { SpinRewardTable } from './components/spin-reward-table'
import { SpinRewardForm } from './components/spin-reward-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SpinRewardType } from '@/schemaValidations/spin-reward.schema'

export default function SpinRewardsClient() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingReward, setEditingReward] = useState<SpinRewardType | null>(null)
  const { data, isLoading } = useGetSpinRewardsQuery()

  const handleNewReward = () => {
    setEditingReward(null)
    setIsFormOpen(true)
  }

  const handleEditReward = (reward: SpinRewardType) => {
    setEditingReward(reward)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingReward(null)
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-end">
        <Button onClick={handleNewReward}>
          <Plus className="mr-2 h-4 w-4" />
          New Reward
        </Button>
      </div>

      <SpinRewardTable
        rewards={data?.payload.data || []}
        isLoading={isLoading}
        onEdit={handleEditReward}
      />

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{editingReward ? 'Edit Reward' : 'Create New Reward'}</DialogTitle>
            <DialogDescription>
              {editingReward ? 'Update the reward details' : 'Create a new reward for a spin event'}
            </DialogDescription>
          </DialogHeader>
          <SpinRewardForm
            reward={editingReward}
            onSuccess={handleCloseForm}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
