import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import EmployeeSpinClient from './employee-spin-client'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('EmployeeSpin')

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default function EmployeeSpinPage() {
  return <EmployeeSpinClient />
}
