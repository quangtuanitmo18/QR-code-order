'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import { mediaApiRequest } from '@/apiRequests/media'
import { useCreateReviewMutation } from '@/queries/useReview'
import { CreateReviewBodyType } from '@/schemaValidations/review.schema'
import { ImagePlus, Star, X } from 'lucide-react'
import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'

interface ReviewFormProps {
  guestId: number
  guestName: string
  onSuccess?: () => void
}

const criteriaLabels = {
  foodQuality: 'Food Quality',
  serviceQuality: 'Service Quality',
  ambiance: 'Ambiance',
  priceValue: 'Price Value',
} as const

export default function ReviewForm({ guestId, guestName, onSuccess }: ReviewFormProps) {
  const [ratings, setRatings] = useState({
    overallRating: 0,
    foodQuality: 0,
    serviceQuality: 0,
    ambiance: 0,
    priceValue: 0,
  })

  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ comment: string }>()

  const createReviewMutation = useCreateReviewMutation()

  const handleRatingClick = (key: keyof typeof ratings, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Check limit
    if (uploadedImages.length + files.length > 5) {
      toast({ description: 'Maximum 5 images allowed' })
      return
    }

    setIsUploading(true)
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({ description: `${file.name} is too large. Maximum 10MB per image.` })
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const result = await mediaApiRequest.upload(formData)
        uploadedUrls.push(result.payload.data)
      }

      setUploadedImages((prev) => [...prev, ...uploadedUrls])
      toast({ description: `${uploadedUrls.length} image(s) uploaded successfully` })
    } catch (error: any) {
      handleErrorApi({ error })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: { comment: string }) => {
    // Validate all ratings
    const missingRatings = Object.entries(ratings).filter(([_, value]) => value === 0)
    if (missingRatings.length > 0) {
      toast({ description: 'Please provide all ratings' })
      return
    }

    const reviewData: CreateReviewBodyType = {
      guestId,
      ...ratings,
      comment: data.comment,
      images: uploadedImages.length > 0 ? uploadedImages : undefined,
    }

    try {
      await createReviewMutation.mutateAsync(reviewData)
      toast({
        title: 'Success',
        description: 'Thank you for your review! It will be published after admin approval.',
      })
      reset()
      setRatings({
        overallRating: 0,
        foodQuality: 0,
        serviceQuality: 0,
        ambiance: 0,
        priceValue: 0,
      })
      setUploadedImages([])
      onSuccess?.()
    } catch (error: any) {
      toast({ description: error?.message || 'Failed to submit review' })
    }
  }

  const RatingStars = ({
    value,
    onChange,
    label,
  }: {
    value: number
    onChange: (v: number) => void
    label: string
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              className={`h-8 w-8 ${
                star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 self-center text-sm text-muted-foreground">
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Share Your Experience</h3>
        <p className="text-sm text-muted-foreground">
          Hello {guestName}, we would love to hear about your dining experience!
        </p>
      </div>

      {/* Overall Rating */}
      <RatingStars
        label="Overall Rating"
        value={ratings.overallRating}
        onChange={(v) => handleRatingClick('overallRating', v)}
      />

      {/* Criteria Ratings */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(Object.keys(criteriaLabels) as Array<keyof typeof criteriaLabels>).map((key) => (
          <RatingStars
            key={key}
            label={criteriaLabels[key]}
            value={ratings[key]}
            onChange={(v) => handleRatingClick(key, v)}
          />
        ))}
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label htmlFor="comment">Your Review</Label>
        <Textarea
          id="comment"
          placeholder="Tell us about your experience... (minimum 10 characters)"
          rows={5}
          {...register('comment', {
            required: 'Review comment is required',
            minLength: {
              value: 10,
              message: 'Comment must be at least 10 characters',
            },
            maxLength: {
              value: 1000,
              message: 'Comment must not exceed 1000 characters',
            },
          })}
          className={errors.comment ? 'border-red-500' : ''}
        />
        {errors.comment && <p className="text-sm text-red-500">{errors.comment.message}</p>}
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Photos (Optional)</Label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || uploadedImages.length >= 5}
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Add Photos'}
            </Button>
            <span className="text-xs text-muted-foreground">
              {uploadedImages.length}/5 images (Max 10MB each)
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Preview uploaded images */}
          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadedImages.map((url, idx) => (
                <div key={idx} className="group relative">
                  <img
                    src={url}
                    alt={`Upload ${idx + 1}`}
                    className="h-20 w-20 rounded-md border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={createReviewMutation.isPending}>
        {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Your review will be visible after admin approval
      </p>
    </form>
  )
}
