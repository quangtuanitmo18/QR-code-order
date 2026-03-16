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
import { ArrowLeft, CheckCircle2, ChevronRight, FileText, Star, XCircle } from 'lucide-react'
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
      <div className="mx-auto w-full max-w-[480px] space-y-8 px-4 py-8 sm:py-12">
        <div className="relative overflow-hidden rounded-3xl border border-green-500/20 bg-green-50/50 p-8 text-center shadow-lg dark:bg-green-950/20">
          <div className="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-green-400/10 blur-2xl"></div>
          <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-green-400/10 blur-2xl"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-inner dark:bg-green-900/50 dark:text-green-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h1 className="mb-3 text-3xl font-black tracking-tight text-green-800 dark:text-green-300">
              Payment Successful!
            </h1>
            <p className="mb-6 font-medium text-green-700/80 dark:text-green-400/80">
              Your order is being prepared and will be served shortly.
            </p>

            <div className="w-full space-y-3 rounded-2xl bg-white/60 p-5 text-sm dark:bg-black/20">
              {amount && (
                <div className="flex justify-between border-b border-green-200/50 pb-3 dark:border-green-800/50">
                  <span className="font-semibold text-green-800/60 dark:text-green-300/60">
                    Amount Paid
                  </span>
                  <span className="font-black text-green-800 dark:text-green-300">
                    {formatCurrency(parseInt(amount))}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-b border-green-200/50 pb-3 dark:border-green-800/50">
                <span className="font-semibold text-green-800/60 dark:text-green-300/60">
                  Payment Method
                </span>
                <span className="font-bold text-green-800 dark:text-green-300">{method}</span>
              </div>
              {txnRef && (
                <div className="flex justify-between pt-1">
                  <span className="font-semibold text-green-800/60 dark:text-green-300/60">
                    Reference ID
                  </span>
                  <span className="font-mono text-xs font-bold text-green-800 dark:text-green-300">
                    {txnRef}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Card className="overflow-hidden rounded-3xl border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-md">
          <CardHeader className="pb-4 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Star className="h-6 w-6 fill-primary" />
            </div>
            <CardTitle className="text-xl font-bold">Share Your Experience</CardTitle>
            <CardDescription className="mx-auto max-w-sm">
              We would love to hear about your dining experience! Your feedback helps us improve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowReviewDialog(true)}
              className="w-full rounded-full font-bold shadow-md hover:shadow-lg"
              size="lg"
            >
              Write a Review
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            onClick={() => router.push(`/${locale}/guest/orders`)}
            className="flex-1 rounded-full font-bold"
            size="lg"
            variant="secondary"
          >
            <FileText className="mr-2 h-4 w-4" /> View Receipt
          </Button>
          <Button
            onClick={() => router.push(`/${locale}/guest/menu`)}
            variant="outline"
            className="flex-1 rounded-full font-bold"
            size="lg"
          >
            Order More <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {/* Review Dialog */}
        {guestId && (
          <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl border-border/50 p-0 sm:p-6">
              <DialogHeader className="p-6 pb-0 sm:p-0">
                <DialogTitle className="text-2xl font-bold">Write a Review</DialogTitle>
                <DialogDescription>
                  Share your experience and help other customers
                </DialogDescription>
              </DialogHeader>
              <div className="p-6 sm:p-0 sm:pt-6">
                <ReviewForm
                  guestId={guestId}
                  guestName="Guest"
                  onSuccess={() => {
                    setShowReviewDialog(false)
                    router.push(`/${locale}/reviews`)
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[400px] space-y-8 px-4 py-12 sm:max-w-md">
      <div className="relative overflow-hidden rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center shadow-lg dark:bg-destructive/10">
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive shadow-inner">
            <XCircle className="h-10 w-10" />
          </div>
          <h1 className="mb-3 text-3xl font-black tracking-tight text-destructive">
            Payment Failed
          </h1>
          <p className="font-medium text-destructive/80">
            {error || 'There was an issue processing your payment. Your card was not charged.'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Button
          onClick={() => router.back()}
          className="rounded-full font-bold shadow-md hover:shadow-lg"
          size="lg"
        >
          Try Payment Again
        </Button>
        <Button
          onClick={() => router.push(`/${locale}/guest/orders`)}
          variant="outline"
          className="rounded-full font-bold"
          size="lg"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Button>
      </div>
    </div>
  )
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      }
    >
      <PaymentResultComponent />
    </Suspense>
  )
}
