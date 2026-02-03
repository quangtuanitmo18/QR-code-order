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
  const [isSpinning, setIsSpinning] = useState(false)
  const [mustSpin, setMustSpin] = useState(false)
  const [prizeNumber, setPrizeNumber] = useState<number | null>(null)

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
      if (isSpinning || mustSpin) return

      setIsSpinning(true)
      // Reset states before starting new spin
      setMustSpin(false)
      setPrizeNumber(null)
      setSelectedReward(null)
      setSelectedSpin(null)

      const result = await executeSpinMutation.mutateAsync({ spinId })

      // Debug log
      console.log('[EmployeeSpinClient] executeSpin result:', result)

      // Get reward ID from backend response
      const backendRewardId = result.payload.data.reward?.id
      console.log('[EmployeeSpinClient] Backend rewardId:', backendRewardId)
      console.log(
        '[EmployeeSpinClient] Available rewards:',
        rewards.map((r) => ({ id: r.id, name: r.name }))
      )

      if (!backendRewardId) {
        console.error('[EmployeeSpinClient] No rewardId in backend response')
        setIsSpinning(false)
        setMustSpin(false)
        setPrizeNumber(null)
        return
      }

      // Find the index of the won reward in the rewards array
      // This index will be used as prizeNumber for the wheel
      const prizeIndex = rewards.findIndex((r) => r.id === backendRewardId)

      if (prizeIndex === -1) {
        console.error(
          `[EmployeeSpinClient] Reward ID ${backendRewardId} not found in rewards list`,
          rewards.map((r) => r.id)
        )
        setIsSpinning(false)
        setMustSpin(false)
        setPrizeNumber(null)
        return
      }

      console.log(
        '[EmployeeSpinClient] Prize index:',
        prizeIndex,
        'for reward:',
        rewards[prizeIndex]?.name
      )

      // Find and set the reward that was won (for modal display)
      const wonReward = rewards.find((r) => r.id === backendRewardId)
      if (wonReward) {
        setSelectedReward({ ...wonReward, id: wonReward.id })
        setSelectedSpin(result.payload.data)
      }

      // Set prize number first, then trigger spin
      // The library needs prizeNumber to be set before mustStartSpinning becomes true
      setPrizeNumber(prizeIndex)

      // Use setTimeout to ensure state updates are processed before triggering spin
      setTimeout(() => {
        console.log('[EmployeeSpinClient] Triggering spin with prizeNumber:', prizeIndex)
        setMustSpin(true)
      }, 100)
    } catch (error) {
      handleErrorApi({ error: error as any })
      setIsSpinning(false)
      setMustSpin(false)
      setPrizeNumber(null)
      setSelectedReward(null)
      setSelectedSpin(null)
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
                availableSpins={availableSpinsForWheel.length}
                isSpinning={isSpinning}
                isLoading={rewardsLoading || executeSpinMutation.isPending}
                mustSpin={mustSpin}
                prizeNumber={prizeNumber}
                onSpinClick={() => {
                  if (!firstAvailableSpin) return
                  void handleSpin(firstAvailableSpin.id)
                }}
                onStopSpinning={() => {
                  console.log('[EmployeeSpinClient] Wheel stopped spinning')
                  setMustSpin(false)
                  setIsSpinning(false)
                  // Open modal after wheel stops
                  if (selectedReward && selectedSpin) {
                    setResultModalOpen(true)
                  } else {
                    console.warn(
                      '[EmployeeSpinClient] No selectedReward or selectedSpin when wheel stopped'
                    )
                  }
                }}
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
