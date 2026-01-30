'use client'

import ReviewForm from '@/components/review/review-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Role } from '@/constants/type'
import { decodeToken, formatCurrency, getAccessTokenFromLocalStorage } from '@/lib/utils'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function PaymentResultComponent() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'
  const amount = searchParams.get('amount')
  const txnRef = searchParams.get('txnRef')
  const method = searchParams.get('method') || 'Unknown'
  const error = searchParams.get('error')

  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [guestId, setGuestId] = useState<number | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)

    const token = getAccessTokenFromLocalStorage()
    if (token) {
      try {
        const payload = decodeToken(token)
        if (payload.role === Role.Guest) {
          setGuestId(payload.userId)
        }
      } catch {
        // Invalid token
      }
    }
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

        <Card>
          <CardHeader>
            <CardTitle>🌟 Share Your Experience</CardTitle>
            <CardDescription>
              We would love to hear about your dining experience! Your feedback helps us improve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowReviewDialog(true)}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Write a Review
            </Button>
          </CardContent>
        </Card>

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

        {/* Review Dialog */}
        {guestId && (
          <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
                <DialogDescription>
                  Share your experience and help other customers
                </DialogDescription>
              </DialogHeader>
              <ReviewForm
                guestId={guestId}
                guestName="Guest"
                onSuccess={() => {
                  setShowReviewDialog(false)
                  router.push(`/${locale}/reviews`)
                }}
              />
            </DialogContent>
          </Dialog>
        )}
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
        <Button onClick={() => router.push('/en/guest/orders')} className="flex-1" size="lg">
          Back to Orders
        </Button>
        <Button onClick={() => router.back()} variant="outline" className="flex-1" size="lg">
          Try Again
        </Button>
      </div>
    </div>
  )
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentResultComponent />
    </Suspense>
  )
}
