'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { Star } from 'lucide-react'

interface Review {
  id: number
  guestId: number
  overallRating: number
  foodQuality: number
  serviceQuality: number
  ambiance: number
  priceValue: number
  comment: string
  images: string | null
  createdAt: string | Date
  replyContent: string | null
  repliedAt: string | Date | null
  guest?: {
    id: number
    name: string
  }
  replier?: {
    id: number
    name: string
  } | null
}

interface ReviewListProps {
  reviews: Review[]
  showStats?: boolean
}

export default function ReviewList({ reviews, showStats = false }: ReviewListProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const renderImages = (imagesJson: string | null) => {
    if (!imagesJson) return null

    try {
      const images = JSON.parse(imagesJson) as string[]
      if (images.length === 0) return null

      return (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((image, idx) => (
            <img
              key={idx}
              src={image}
              alt={`Review image ${idx + 1}`}
              className="h-24 w-24 rounded-md object-cover"
            />
          ))}
        </div>
      )
    } catch (error) {
      console.error('Failed to parse review images JSON:', imagesJson, error)
      return null
    }
  }

  if (reviews.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No reviews yet. Be the first to share your experience!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-6">
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{review.guest?.name || 'Guest'}</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {renderStars(review.overallRating)}
                <span className="text-sm font-medium">{review.overallRating}/5</span>
              </div>
            </div>

            {/* Criteria ratings (optional detailed view) */}
            {showStats && (
              <div className="mb-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                <div>
                  <span className="text-muted-foreground">Food: </span>
                  <span className="font-medium">{review.foodQuality}/5</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Service: </span>
                  <span className="font-medium">{review.serviceQuality}/5</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ambiance: </span>
                  <span className="font-medium">{review.ambiance}/5</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Value: </span>
                  <span className="font-medium">{review.priceValue}/5</span>
                </div>
              </div>
            )}

            {/* Comment */}
            <p className="mb-2 text-sm leading-relaxed">{review.comment}</p>

            {/* Images */}
            {renderImages(review.images)}

            {/* Admin Reply */}
            {review.replyContent && (
              <div className="mt-4 rounded border-l-2 border-primary/30 bg-muted/50 p-3 pl-4">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Restaurant Reply
                  </Badge>
                  {review.repliedAt && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.repliedAt), 'MMM dd, yyyy')}
                    </span>
                  )}
                </div>
                <p className="text-sm">{review.replyContent}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
