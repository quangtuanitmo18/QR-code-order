'use client'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function PaymentResultPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'
  const amount = searchParams.get('amount')
  const txnRef = searchParams.get('txnRef')
  const method = searchParams.get('method') || 'Unknown' // THÊM
  const error = searchParams.get('error')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (success) {
    return (
      <div className="mx-auto w-full max-w-[400px] space-y-6 py-8 sm:max-w-2xl">
        <div className="rounded-lg border border-green-500 bg-green-50 p-6 text-center dark:bg-green-950">
          <div className="mb-4 text-6xl">✅</div>
          <h1 className="mb-2 text-2xl font-bold text-green-700 dark:text-green-300">
            Payment Successful!
          </h1>
          <p className="mb-4 text-green-600 dark:text-green-400">
            Your payment has been processed successfully
          </p>
          {amount && (
            <div className="mb-2">
              <span className="text-lg font-semibold text-green-700 dark:text-green-300">
                Amount: {formatCurrency(parseInt(amount))}
              </span>
            </div>
          )}
          <div className="mb-2 text-sm text-green-600 dark:text-green-400">
            Payment Method: {method}
          </div>
          {txnRef && (
            <div className="mb-4 text-sm text-green-600 dark:text-green-400">
              Transaction Reference: {txnRef}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => router.push('/en/guest/orders')} className="flex-1" size="lg">
            View Orders
          </Button>
          <Button
            onClick={() => router.push('/en/guest/menu')}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            Continue Ordering
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[400px] space-y-6 py-8 sm:max-w-2xl">
      <div className="rounded-lg border border-red-500 bg-red-50 p-6 text-center dark:bg-red-950">
        <div className="mb-4 text-6xl">❌</div>
        <h1 className="mb-2 text-2xl font-bold text-red-700 dark:text-red-300">Payment Failed</h1>
        <p className="mb-4 text-red-600 dark:text-red-400">
          {error || 'There was an issue processing your payment'}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => router.push('/guest/orders')} className="flex-1" size="lg">
          Back to Orders
        </Button>
        <Button onClick={() => router.back()} variant="outline" className="flex-1" size="lg">
          Try Again
        </Button>
      </div>
    </div>
  )
}