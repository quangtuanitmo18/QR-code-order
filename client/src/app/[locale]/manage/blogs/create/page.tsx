'use client'

import BlogForm from '@/components/blog/blog-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from '@/i18n/routing'
import { handleErrorApi } from '@/lib/utils'
import { useCreateBlogPostMutation } from '@/queries/useBlog'
import { CreateBlogPostBodyType } from '@/schemaValidations/blog-post.schema'

export default function CreateBlogPostPage() {
  const router = useRouter()
  const createMutation = useCreateBlogPostMutation()

  const handleSubmit = async (values: CreateBlogPostBodyType) => {
    try {
      const result = await createMutation.mutateAsync(values)
      toast({
        title: 'Success',
        description: result.payload.message || 'Blog post created successfully',
      })

      // Redirect to edit page or manage list
      const postId = result.payload.data.id
      router.push(`/manage/blogs/${postId}/edit`)
    } catch (error) {
      handleErrorApi({ error })
      throw error // Re-throw to prevent form from resetting
    }
  }

  return (
    <main className="grid flex-1 items-start gap-4 p-3 sm:p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-2 sm:space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Create New Blog Post</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Create a new blog post. Fill in all required fields and publish when ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BlogForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
