'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import DishCategoriesClient from './dish-categories-client'
import DishTable from './dish-table'

import { useTranslations } from 'next-intl'

export default function DishClient() {
  const [activeTab, setActiveTab] = useState('dishes')
  const t = useTranslations('Dishes')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full max-w-xs grid-cols-2">
        <TabsTrigger value="dishes">{t('tabDishes')}</TabsTrigger>
        <TabsTrigger value="categories">{t('tabCategories')}</TabsTrigger>
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
