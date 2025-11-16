'use client'

import { useIncrementViewCountMutation } from '@/queries/useBlog'
import { useEffect, useRef } from 'react'

export default function BlogDetailClient({ slug }: { slug: string }) {
  const incrementViewCount = useIncrementViewCountMutation()
  const hasIncremented = useRef(false)

  useEffect(() => {
    // Prevent duplicate view counts using sessionStorage
    const storageKey = `blog-view-${slug}`
    const hasViewed = sessionStorage.getItem(storageKey)

    if (!hasViewed && !hasIncremented.current) {
      hasIncremented.current = true

      // Increment view count on mount (non-blocking)
      incrementViewCount.mutate(slug, {
        onSuccess: () => {
          // Mark as viewed in sessionStorage (expires when session ends)
          sessionStorage.setItem(storageKey, 'true')
        },
        onError: (error) => {
          // Silently fail - view count is not critical
          console.error('Failed to increment view count:', error)
        },
      })
    }
  }, [slug, incrementViewCount])

  // This component doesn't render anything
  return null
}
