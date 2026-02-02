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
} from '@/queries/useEmployeeSpin'
import { useGetActiveSpinEventsQuery } from '@/queries/useSpinEvent'
import { EmployeeSpinType, GetActiveRewardsResType } from '@/schemaValidations/employee-spin.schema'
import { format } from 'date-fns'
import { useState } from 'react'
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

  // Queries - only load rewards when event is selected
  const { data: rewardsData, isLoading: rewardsLoading } = useGetActiveRewardsQuery(
    selectedEventId ? { eventId: selectedEventId } : undefined
  )
  const { data: mySpinsData, isLoading: spinsLoading } = useGetMySpinsQuery(
    selectedEventId
      ? {
          eventId: selectedEventId,
        }
      : undefined
  )
  const { data: activeEventsData, isLoading: eventsLoading } = useGetActiveSpinEventsQuery()

  // Mutations
  const executeSpinMutation = useExecuteSpinMutation()
  const claimRewardMutation = useClaimRewardMutation()

  // Handle spin execution
  const handleSpin = async (spinId: number) => {
    try {
      const result = await executeSpinMutation.mutateAsync({ spinId })

      // Set won reward ID for wheel animation
      if (result.payload.data.reward?.id) {
        setWonRewardId(result.payload.data.reward.id)
      }

      // Find the reward that was won
      const wonReward = rewardsData?.payload?.data?.find(
        (r) => r.id === result.payload.data.reward?.id
      )
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
  const allSpins = mySpinsData?.payload?.data?.spins || [] // Already filtered by API if eventId provided
  const activeEvents = activeEventsData?.payload?.data || []

  // Filter spins for spin wheel: rewardId = null and status = PENDING
  const availableSpinsForWheel = allSpins.filter(
    (spin) => spin.rewardId === null && spin.status === 'PENDING'
  )
  const firstAvailableSpin = availableSpinsForWheel[0]

  // Filter spins for history: rewardId != null and status != PENDING
  const historySpins = allSpins.filter((spin) => spin.rewardId !== null)

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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="spin">Spin Wheel</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="spin" className="space-y-6">
              <SpinWheel
                rewards={rewards}
                onSpin={handleSpin}
                availableSpins={availableSpinsForWheel.length}
                pendingSpinId={firstAvailableSpin?.id}
                isLoading={rewardsLoading || executeSpinMutation.isPending}
                wonRewardId={wonRewardId}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <RewardHistory
                spins={historySpins}
                isLoading={spinsLoading}
                onClaim={handleClaim}
                isClaiming={claimRewardMutation.isPending}
              />
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
