'use client'

import BlogCard from '@/components/blog/blog-card'
import BlogCardSkeleton from '@/components/blog/blog-card-skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from '@/i18n/routing'
import { useBlogPostsQuery } from '@/queries/useBlog'
import type { GetBlogPostsPublicQueryType } from '@/schemaValidations/blog-post.schema'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function BlogList() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = params.locale as string

  // Get query params from URL
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
  const category = searchParams.get('category') || undefined
  const tag = searchParams.get('tag') || undefined
  const search = searchParams.get('search') || undefined
  const featured = searchParams.get('featured') === 'true' ? true : undefined

  const [searchQuery, setSearchQuery] = useState(search || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      const newParams = new URLSearchParams(searchParams.toString())
      if (searchQuery) {
        newParams.set('search', searchQuery)
      } else {
        newParams.delete('search')
      }
      newParams.set('page', '1')
      router.push(`/blogs?${newParams.toString()}`)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, router, locale, searchParams])

  const query: GetBlogPostsPublicQueryType = {
    page,
    limit: 10,
    category,
    tag,
    search: debouncedSearch || undefined,
    featured,
  }

  const blogPostsQuery = useBlogPostsQuery(query)

  const handleCategoryChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      newParams.delete('category')
    } else {
      newParams.set('category', value)
    }
    newParams.set('page', '1')
    router.push(`/blogs?${newParams.toString()}`)
  }

  const handleTagChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      newParams.delete('tag')
    } else {
      newParams.set('tag', value)
    }
    newParams.set('page', '1')
    router.push(`/blogs?${newParams.toString()}`)
  }

  const handleFeaturedChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      newParams.delete('featured')
    } else {
      newParams.set('featured', value)
    }
    newParams.set('page', '1')
    router.push(`/blogs?${newParams.toString()}`)
  }

  if (blogPostsQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <BlogCardSkeleton key={idx} />
        ))}
      </div>
    )
  }

  if (blogPostsQuery.isError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-destructive">Failed to load blog posts</div>
      </div>
    )
  }

  const data = blogPostsQuery.data?.payload.data || []
  const pagination = blogPostsQuery.data?.payload.pagination

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          placeholder="Search blog posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <Select value={category || 'all'} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {/* Categories will be populated dynamically if needed */}
          </SelectContent>
        </Select>
        <Select value={featured ? 'featured' : 'all'} onValueChange={handleFeaturedChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Posts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="featured">Featured Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Blog Posts Grid */}
      {data.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">No blog posts found</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.map((post) => (
              <BlogCard key={post.id} post={post} locale={locale} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams.toString())
                  newParams.set('page', String(page - 1))
                  router.push(`/blogs?${newParams.toString()}`)
                }}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= pagination.totalPages}
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams.toString())
                  newParams.set('page', String(page + 1))
                  router.push(`/blogs?${newParams.toString()}`)
                }}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
