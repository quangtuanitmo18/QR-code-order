'use client'

import BlogForm from '@/components/blog/blog-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import { useBlogPostByIdQuery, useUpdateBlogPostMutation } from '@/queries/useBlog'
import { CreateBlogPostBodyType } from '@/schemaValidations/blog-post.schema'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'

export default function EditBlogPostPage() {
  const params = useParams()
  const postId = params.id ? parseInt(params.id as string) : undefined
  const blogPostQuery = useBlogPostByIdQuery(postId || 0, !!postId)
  const updateMutation = useUpdateBlogPostMutation()

  const defaultValues = useMemo(() => {
    if (!blogPostQuery.data?.payload.data) return undefined

    const post = blogPostQuery.data.payload.data
    return {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      featuredImage: post.featuredImage || undefined,
      status: post.status as 'DRAFT' | 'PUBLISHED',
      featured: post.featured,
      category: post.category || '',
      tags: post.tags ? JSON.parse(post.tags) : [],
    }
  }, [blogPostQuery.data])

  const handleSubmit = async (values: CreateBlogPostBodyType) => {
    if (!postId) return

    try {
      const result = await updateMutation.mutateAsync({
        id: postId,
        ...values,
      })
      toast({
        title: 'Success',
        description: result.payload.message || 'Blog post updated successfully',
      })
    } catch (error) {
      handleErrorApi({ error })
      throw error
    }
  }

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

  return (
    <main className="grid flex-1 items-start gap-4 p-3 sm:p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-2 sm:space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Edit Blog Post</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Update your blog post. Changes will be reflected after saving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {defaultValues && (
              <BlogForm
                defaultValues={defaultValues}
                onSubmit={handleSubmit}
                isLoading={updateMutation.isPending}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
