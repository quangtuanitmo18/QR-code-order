'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Star } from 'lucide-react'

interface ReviewStatsData {
  totalReviews: number
  averageOverallRating: number
  averageFoodQuality: number
  averageServiceQuality: number
  averageAmbiance: number
  averagePriceValue: number
  ratingDistribution: {
    '1': number
    '2': number
    '3': number
    '4': number
    '5': number
  }
}

interface ReviewStatsProps {
  stats: ReviewStatsData
}

export default function ReviewStats({ stats }: ReviewStatsProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const getPercentage = (count: number) => {
    if (stats.totalReviews === 0) return 0
    return Math.round((count / stats.totalReviews) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Overall Rating Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold">{stats.averageOverallRating.toFixed(1)}</div>
            <div className="space-y-1">
              {renderStars(stats.averageOverallRating)}
              <p className="text-sm text-muted-foreground">
                Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count =
              stats.ratingDistribution[String(rating) as keyof typeof stats.ratingDistribution]
            const percentage = getPercentage(count)

            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex w-16 items-center gap-1">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <Progress value={percentage} className="h-2 flex-1" />
                <div className="w-16 text-right text-sm text-muted-foreground">
                  {count} ({percentage}%)
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Criteria Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Criteria Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Food Quality', value: stats.averageFoodQuality },
            { label: 'Service Quality', value: stats.averageServiceQuality },
            { label: 'Ambiance', value: stats.averageAmbiance },
            { label: 'Price Value', value: stats.averagePriceValue },
          ].map((criteria) => (
            <div key={criteria.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{criteria.label}</span>
                <span className="text-sm font-semibold">{criteria.value.toFixed(1)}/5</span>
              </div>
              <Progress value={(criteria.value / 5) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
