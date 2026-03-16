'use client'

import ReviewForm from '@/components/review/review-form'
import ReviewList from '@/components/review/review-list'
import ReviewStats from '@/components/review/review-stats'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Role } from '@/constants/type'
import { decodeToken, getAccessTokenFromLocalStorage } from '@/lib/utils'
import { useReviewListQuery, useReviewStatsQuery } from '@/queries/useReview'
import { ChevronLeft, ChevronRight, MessageSquareHeart, PenSquare } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ReviewsClient() {
  const [currentPage, setCurrentPage] = useState(1)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [guestId, setGuestId] = useState<number | null>(null)
  const pageSize = 10

  useEffect(() => {
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

  const reviewsQuery = useReviewListQuery()
  const statsQuery = useReviewStatsQuery()

  const allReviews = reviewsQuery.data?.payload?.data ?? []
  const stats = statsQuery.data?.payload?.data

  // Client-side pagination
  const totalPages = Math.ceil(allReviews.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const reviews = allReviews.slice(startIndex, endIndex)

  const isLoading = reviewsQuery.isLoading || statsQuery.isLoading

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12 md:py-16">
      <div className="mb-10 sm:mb-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageSquareHeart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                Customer Reviews
              </h1>
              <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
                See what our customers are saying about their dining experience
              </p>
            </div>
          </div>
          {guestId && (
            <Button
              onClick={() => setShowReviewDialog(true)}
              size="lg"
              className="rounded-full px-8 py-6 text-base font-bold shadow-xl shadow-primary/20 transition-transform hover:-translate-y-1"
            >
              <PenSquare className="mr-2 h-5 w-5" />
              Write a Review
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="reviews" className="space-y-8">
        <TabsList className="grid h-14 w-full max-w-md grid-cols-2 rounded-full border border-border/50 bg-muted/50 p-1 backdrop-blur-sm">
          <TabsTrigger
            value="reviews"
            className="rounded-full text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            All Reviews
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="rounded-full text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-8 space-y-8">
          <div className="rounded-3xl border border-border/50 bg-card/50 p-6 shadow-sm backdrop-blur-sm sm:p-8">
            <div className="mb-8 flex items-end justify-between border-b border-border/50 pb-4">
              <h2 className="text-2xl font-bold tracking-tight">Latest Feedback</h2>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                {allReviews.length > 0 ? `${allReviews.length} Total` : 'Loading...'}
              </span>
            </div>

            <div className="mt-6">
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="space-y-4 rounded-2xl border border-border/50 bg-background/50 p-6"
                    >
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-14 w-14 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <>
                  <div className="space-y-6">
                    <ReviewList reviews={reviews} showStats={false} />
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl bg-muted/30 p-4 sm:flex-row sm:px-6">
                      <div className="text-sm font-medium text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(endIndex, allReviews.length)} of{' '}
                        {allReviews.length} reviews
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="mr-1 h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => setCurrentPage((p) => p + 1)}
                          disabled={currentPage >= totalPages}
                        >
                          Next
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <MessageSquareHeart className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-lg font-medium">No reviews yet.</p>
                  <p className="text-sm">Be the first to share your experience!</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="stats"
          className="mt-8 space-y-8 duration-500 animate-in fade-in slide-in-from-bottom-4"
        >
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-3xl" />
              <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
          ) : stats ? (
            <div className="rounded-3xl border border-border/50 bg-card/50 p-6 shadow-sm backdrop-blur-sm sm:p-8">
              <ReviewStats stats={stats} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-border/50 bg-card/50 py-16 text-center text-muted-foreground">
              <p className="text-lg font-medium">No statistics available yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      {guestId && (
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl border-border/50 p-0 sm:p-6">
            <DialogHeader className="p-6 pb-0 sm:p-0">
              <DialogTitle className="text-2xl font-bold">Write a Review</DialogTitle>
              <DialogDescription>Share your experience and help other customers</DialogDescription>
            </DialogHeader>
            <div className="p-6 sm:p-0 sm:pt-6">
              <ReviewForm
                guestId={guestId}
                guestName="Guest"
                onSuccess={() => {
                  setShowReviewDialog(false)
                  reviewsQuery.refetch()
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
