'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import DishCategoriesClient from './dish-categories-client'
import DishTable from './dish-table'

export default function DishClient() {
  const [activeTab, setActiveTab] = useState('dishes')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full max-w-xs grid-cols-2">
        <TabsTrigger value="dishes">Dishes</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
      </TabsList>
      <TabsContent value="dishes" className="mt-4">
        <DishTable />
      </TabsContent>
      <TabsContent value="categories" className="mt-4">
        <DishCategoriesClient />
      </TabsContent>
    </Tabs>
  )
}
