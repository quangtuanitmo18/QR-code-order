'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  useGetActiveRewardsQuery,
  useGetMySpinsQuery,
  useGetPendingRewardsQuery,
  useExecuteSpinMutation,
  useClaimRewardMutation,
} from '@/queries/useEmployeeSpin'
import { useGetActiveSpinEventsQuery } from '@/queries/useSpinEvent'
import { SpinWheel } from './components/spin-wheel'
import { SpinResultModal } from './components/spin-result-modal'
import { RewardHistory } from './components/reward-history'
import { PendingRewards } from './components/pending-rewards'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import { GetActiveRewardsResType, EmployeeSpinType } from '@/schemaValidations/employee-spin.schema'
import { format } from 'date-fns'

export default function EmployeeSpinClient() {
  const [selectedTab, setSelectedTab] = useState('spin')
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [selectedReward, setSelectedReward] = useState<
    (GetActiveRewardsResType['data'][0] & { id: number }) | null
  >(null)
  const [selectedSpin, setSelectedSpin] = useState<EmployeeSpinType | null>(null)
  const [wonRewardId, setWonRewardId] = useState<number | null>(null)

  // Queries
  const { data: rewardsData, isLoading: rewardsLoading } = useGetActiveRewardsQuery()
  const { data: pendingRewardsData, isLoading: pendingLoading } = useGetPendingRewardsQuery()
  const { data: mySpinsData, isLoading: spinsLoading } = useGetMySpinsQuery({ page: 1, limit: 50 })
  const { data: activeEventsData, isLoading: eventsLoading } = useGetActiveSpinEventsQuery()

  // Mutations
  const executeSpinMutation = useExecuteSpinMutation()
  const claimRewardMutation = useClaimRewardMutation()

  // Get available spins count
  const pendingSpins = pendingRewardsData?.data || []
  const availableSpins = pendingSpins.length
  const firstPendingSpin = pendingSpins[0]

  // Handle spin execution
  const handleSpin = async (spinId: number) => {
    try {
      const result = await executeSpinMutation.mutateAsync({ spinId })

      // Set won reward ID for wheel animation
      if (result.data.reward?.id) {
        setWonRewardId(result.data.reward.id)
      }

      // Find the reward that was won
      const wonReward = rewardsData?.data.find((r) => r.id === result.data.reward?.id)
      if (wonReward) {
        setSelectedReward({ ...wonReward, id: wonReward.id })
        setSelectedSpin(result.data)

        // Show modal after animation completes
        setTimeout(() => {
          setResultModalOpen(true)
          // Reset wonRewardId after modal is shown to allow next spin
          setTimeout(() => {
            setWonRewardId(null)
          }, 1000)
        }, 3000)
      }

      toast({
        title: 'Spin completed!',
        description: `You won: ${result.data.reward?.name || 'Unknown reward'}`,
      })

      return { rewardId: result.data.reward?.id || 0 }
    } catch (error) {
      handleErrorApi(error)
      throw error
    }
  }

  // Handle claim reward
  const handleClaim = async (spinId: number) => {
    try {
      await claimRewardMutation.mutateAsync(spinId)
      toast({
        title: 'Reward claimed!',
        description: 'Your reward has been claimed successfully.',
      })
      setResultModalOpen(false)
    } catch (error) {
      handleErrorApi(error)
    }
  }

  const rewards = rewardsData?.data || []
  const spins = mySpinsData?.data.spins || []
  const pendingRewards = pendingRewardsData?.data || []
  const activeEvents = activeEventsData?.data || []

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Employee Spin</h1>
        <p className="text-muted-foreground">Spin the wheel to win rewards!</p>
      </div>

      {/* Active Events Info */}
      {activeEvents.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeEvents.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{event.name}</CardTitle>
                  <Badge variant={event.isActive ? 'default' : 'secondary'}>
                    {event.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {event.description && <CardDescription>{event.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Start:</span>{' '}
                    {format(new Date(event.startDate), 'MMM dd, yyyy')}
                  </div>
                  {event.endDate && (
                    <div>
                      <span className="font-medium">End:</span>{' '}
                      {format(new Date(event.endDate), 'MMM dd, yyyy')}
                    </div>
                  )}
                  {event._count && (
                    <div className="border-t pt-2">
                      <span className="font-medium">Rewards:</span> {event._count.rewards}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="spin">Spin Wheel</TabsTrigger>
          <TabsTrigger value="pending">Pending Rewards</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="spin" className="space-y-6">
          <SpinWheel
            rewards={rewards}
            onSpin={handleSpin}
            availableSpins={availableSpins}
            pendingSpinId={firstPendingSpin?.id}
            isLoading={rewardsLoading || executeSpinMutation.isPending}
            wonRewardId={wonRewardId}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <PendingRewards
            spins={pendingRewards}
            onClaim={handleClaim}
            isLoading={claimRewardMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <RewardHistory spins={spins} isLoading={spinsLoading} />
        </TabsContent>
      </Tabs>

      {/* Result Modal */}
      <SpinResultModal
        reward={selectedReward}
        employeeSpin={selectedSpin}
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        onClaim={selectedSpin ? () => handleClaim(selectedSpin.id) : undefined}
      />
    </div>
  )
}
