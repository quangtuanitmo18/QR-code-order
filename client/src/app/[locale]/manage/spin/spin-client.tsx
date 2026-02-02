'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import SpinEventsClient from '../spin-events/spin-events-client'
import SpinRewardsClient from '../spin-rewards/spin-rewards-client'

export default function SpinClient() {
  const [activeTab, setActiveTab] = useState('events')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="events">Events</TabsTrigger>
        <TabsTrigger value="rewards">Rewards</TabsTrigger>
      </TabsList>
      <TabsContent value="events" className="mt-4">
        <SpinEventsClient />
      </TabsContent>
      <TabsContent value="rewards" className="mt-4">
        <SpinRewardsClient />
      </TabsContent>
    </Tabs>
  )
}

