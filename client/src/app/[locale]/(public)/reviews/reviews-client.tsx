'use client'

import ReviewForm from '@/components/review-form'
import ReviewList from '@/components/review-list'
import ReviewStats from '@/components/review-stats'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ChevronLeft, ChevronRight, PenSquare } from 'lucide-react'
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Customer Reviews</h1>
            <p className="text-muted-foreground">
              See what our customers are saying about their dining experience
            </p>
          </div>
          {guestId && (
            <Button onClick={() => setShowReviewDialog(true)} size="lg" className="gap-2">
              <PenSquare className="h-5 w-5" />
              Write a Review
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="reviews" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="reviews">All Reviews</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
              <CardDescription>
                {allReviews.length > 0 ? `${allReviews.length} reviews` : 'Loading reviews...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <>
                  <ReviewList reviews={reviews} showStats={false} />

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(endIndex, allReviews.length)} of{' '}
                        {allReviews.length} reviews
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => p + 1)}
                          disabled={currentPage >= totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No reviews yet. Be the first to share your experience!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : stats ? (
            <ReviewStats stats={stats} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No statistics available yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      {guestId && (
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
              <DialogDescription>Share your experience and help other customers</DialogDescription>
            </DialogHeader>
            <ReviewForm
              guestId={guestId}
              guestName="Guest"
              onSuccess={() => {
                setShowReviewDialog(false)
                reviewsQuery.refetch()
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
