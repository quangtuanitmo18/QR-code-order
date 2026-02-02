'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import {
    useClaimRewardMutation,
    useExecuteSpinMutation,
    useGetActiveRewardsQuery,
    useGetMySpinsQuery,
    useGetPendingRewardsQuery,
} from '@/queries/useEmployeeSpin'
import { useGetActiveSpinEventsQuery } from '@/queries/useSpinEvent'
import { EmployeeSpinType, GetActiveRewardsResType } from '@/schemaValidations/employee-spin.schema'
import { format } from 'date-fns'
import { useState } from 'react'
import { PendingRewards } from './components/pending-rewards'
import { RewardHistory } from './components/reward-history'
import { SpinResultModal } from './components/spin-result-modal'
import { SpinWheel } from './components/spin-wheel'

export default function EmployeeSpinClient() {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [selectedTab, setSelectedTab] = useState('spin')
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [selectedReward, setSelectedReward] = useState<
    (GetActiveRewardsResType['data'][0] & { id: number }) | null
  >(null)
  const [selectedSpin, setSelectedSpin] = useState<EmployeeSpinType | null>(null)
  const [wonRewardId, setWonRewardId] = useState<number | null>(null)

  // Queries
  const { data: rewardsData, isLoading: rewardsLoading } = useGetActiveRewardsQuery(
    selectedEventId ? { eventId: selectedEventId } : undefined
  )
  const { data: pendingRewardsData, isLoading: pendingLoading } = useGetPendingRewardsQuery(
    selectedEventId ? { eventId: selectedEventId } : undefined
  )
  const { data: mySpinsData, isLoading: spinsLoading } = useGetMySpinsQuery({
    page: 1,
    limit: 50,
    ...(selectedEventId && { eventId: selectedEventId }),
  })
  const { data: activeEventsData, isLoading: eventsLoading } = useGetActiveSpinEventsQuery()

  // Mutations
  const executeSpinMutation = useExecuteSpinMutation()
  const claimRewardMutation = useClaimRewardMutation()

  // Get available spins count (will be filtered by event later)
  const allPendingSpins = pendingRewardsData?.payload?.data || []

  // Handle spin execution
  const handleSpin = async (spinId: number) => {
    try {
      const result = await executeSpinMutation.mutateAsync({ spinId })

      // Set won reward ID for wheel animation
      if (result.payload.data.reward?.id) {
        setWonRewardId(result.payload.data.reward.id)
      }

      // Find the reward that was won
      const wonReward = rewardsData?.payload?.data?.find((r) => r.id === result.payload.data.reward?.id)
      if (wonReward) {
        setSelectedReward({ ...wonReward, id: wonReward.id })
        setSelectedSpin(result.payload.data)

        // Show modal after animation completes
        setTimeout(() => {
          setResultModalOpen(true)
          // Reset wonRewardId after modal is shown to allow next spin
          setTimeout(() => {
            setWonRewardId(null)
          }, 1000)
        }, 3000)
      }

      // toast({
      //   title: 'Spin completed!',
      //   description: `You won: ${result.payload.data.reward?.name || 'Unknown reward'}`,
      // })
    } catch (error) {
      handleErrorApi({ error: error as any })
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
      handleErrorApi({ error: error as any })
    }
  }

  const rewards = rewardsData?.payload?.data || []
  const spins = mySpinsData?.payload?.data?.spins || [] // Already filtered by API if eventId provided
  const pendingRewards = pendingRewardsData?.payload?.data || [] // Already filtered by API if eventId provided
  const activeEvents = activeEventsData?.payload?.data || []

  // Get available spins count for selected event
  const availableSpins = pendingRewards.length
  const firstPendingSpin = pendingRewards[0]

  // Get selected event
  const selectedEvent = activeEvents.find((e) => e.id === selectedEventId)

  return (
    <div className="space-y-6">
      {/* Event Selection */}
      {!selectedEventId && (
        <div>
          <h3 className="mb-4 text-lg font-semibold">Select an Event</h3>
          {activeEvents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeEvents.map((event) => (
                <Card
                  key={event.id}
                  className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                  onClick={() => setSelectedEventId(event.id)}
                >
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
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>No active events available.</p>
            </div>
          )}
        </div>
      )}

      {/* Selected Event Info and Tabs */}
      {selectedEventId && selectedEvent && (
        <>
          {/* Selected Event Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedEvent.name}</CardTitle>
                  {selectedEvent.description && (
                    <CardDescription>{selectedEvent.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedEvent.isActive ? 'default' : 'secondary'}>
                    {selectedEvent.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => setSelectedEventId(null)}>
                    Change Event
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="font-medium">Start:</span>{' '}
                  {format(new Date(selectedEvent.startDate), 'MMM dd, yyyy')}
                </div>
                {selectedEvent.endDate && (
                  <div>
                    <span className="font-medium">End:</span>{' '}
                    {format(new Date(selectedEvent.endDate), 'MMM dd, yyyy')}
                  </div>
                )}
                {selectedEvent._count && (
                  <div>
                    <span className="font-medium">Rewards:</span> {selectedEvent._count.rewards}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
        </>
      )}

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
