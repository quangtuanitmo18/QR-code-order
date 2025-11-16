'use client'

import BlogContent from '@/components/blog/blog-content'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from '@/i18n/routing'
import { useBlogPostByIdQuery } from '@/queries/useBlog'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { useParams } from 'next/navigation'

export default function PreviewBlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id ? parseInt(params.id as string) : undefined
  const blogPostQuery = useBlogPostByIdQuery(postId || 0, !!postId)

  if (blogPostQuery.isLoading) {
    return (
      <main className="grid flex-1 items-start gap-4 p-3 sm:p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="space-y-2 sm:space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  if (blogPostQuery.isError || !blogPostQuery.data) {
    return (
      <main className="grid flex-1 items-start gap-4 p-3 sm:p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="space-y-2 sm:space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>Failed to load blog post</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  const post = blogPostQuery.data.payload.data
  const tags = post.tags ? JSON.parse(post.tags) : []

  return (
    <main className="grid flex-1 items-start gap-4 p-3 sm:p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-4">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/manage/blogs/${postId}/edit`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Edit
        </Button>

        {/* Blog post preview */}
        <article className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <header className="space-y-4">
            <div className="flex items-center gap-2">
              {post.status === 'PUBLISHED' && <Badge className="bg-green-500">Published</Badge>}
              {post.status === 'DRAFT' && <Badge variant="secondary">Draft</Badge>}
              {post.status === 'ARCHIVED' && <Badge variant="outline">Archived</Badge>}
              {post.featured && <Badge>Featured</Badge>}
            </div>

            <h1 className="text-3xl font-bold sm:text-4xl">{post.title}</h1>

            {post.excerpt && <p className="text-lg text-muted-foreground">{post.excerpt}</p>}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {post.author && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={post.author.avatar || ''} />
                    <AvatarFallback>
                      {post.author.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{post.author.name}</span>
                </div>
              )}
              {post.publishedAt && (
                <span>{format(new Date(post.publishedAt), 'MMMM dd, yyyy')}</span>
              )}
              <span>{post.viewCount} views</span>
            </div>

            {(post.category || tags.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                {post.category && <Badge variant="outline">{post.category}</Badge>}
                {tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
            </div>
          )}

          {/* Content */}
          <BlogContent content={post.content} />
        </article>
      </div>
    </main>
  )
}
