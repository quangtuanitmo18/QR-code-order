import blogApiRequest from '@/apiRequests/blog'
import revalidateApiRequest from '@/apiRequests/revalidate'
import { revalidateWithRetry } from '@/lib/revalidate'
import type {
  CreateBlogPostBodyType,
  GetBlogPostsManageQueryType,
  GetBlogPostsPublicQueryType,
  UpdateBlogPostBodyType,
} from '@/schemaValidations/blog-post.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Public hooks

// GET /blog-posts - Get published blog posts with pagination
export const useBlogPostsQuery = (query?: GetBlogPostsPublicQueryType) => {
  return useQuery({
    queryKey: ['blog-posts', 'public', query],
    queryFn: () => blogApiRequest.getBlogPosts(query),
  })
}

// GET /blog-posts/:slug - Get blog post by slug
export const useBlogPostBySlugQuery = (slug: string, enabled = true) => {
  return useQuery({
    queryKey: ['blog-posts', 'public', slug],
    queryFn: () => blogApiRequest.getBlogPostBySlug(slug),
    enabled: enabled && !!slug,
  })
}

// POST /blog-posts/:slug/view - Increment view count
export const useIncrementViewCountMutation = () => {
  return useMutation({
    mutationFn: (slug: string) => blogApiRequest.incrementViewCount(slug),
    // Non-blocking, no need to invalidate queries
  })
}

// Manage hooks (Owner only)

// GET /blog-posts/manage - Get all blog posts (returns all for client-side pagination)
export const useBlogPostsManageQuery = (query?: GetBlogPostsManageQueryType) => {
  return useQuery({
    queryKey: ['blog-posts', 'manage', query],
    queryFn: () => blogApiRequest.getBlogPostsManage(query),
  })
}

// GET /blog-posts/manage/:id - Get blog post by ID
export const useBlogPostByIdQuery = (id: number, enabled = true) => {
  return useQuery({
    queryKey: ['blog-posts', 'manage', id],
    queryFn: () => blogApiRequest.getBlogPostById(id),
    enabled: enabled && !!id,
  })
}

// POST /blog-posts - Create blog post
export const useCreateBlogPostMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateBlogPostBodyType) => blogApiRequest.create(body),
    onSuccess: async (data) => {
      // Invalidate manage queries
      queryClient.invalidateQueries({ queryKey: ['blog-posts', 'manage'] })

      // Revalidate SSG cache if published (with retry logic)
      if (data.payload.data.status === 'PUBLISHED') {
        await revalidateWithRetry('blog-posts')
      }
    },
  })
}

// PUT /blog-posts/:id - Update blog post
export const useUpdateBlogPostMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateBlogPostBodyType & { id: number }) =>
      blogApiRequest.update(id, body),
    onSuccess: async (data, variables) => {
      // Invalidate manage queries
      queryClient.invalidateQueries({ queryKey: ['blog-posts', 'manage'] })
      queryClient.invalidateQueries({ queryKey: ['blog-posts', 'manage', variables.id] })

      // Invalidate public queries if status changed to PUBLISHED
      if (data.payload.data.status === 'PUBLISHED') {
        queryClient.invalidateQueries({ queryKey: ['blog-posts', 'public'] })
        queryClient.invalidateQueries({
          queryKey: ['blog-posts', 'public', data.payload.data.slug],
        })

        // Revalidate SSG cache
        try {
          await revalidateApiRequest('blog-posts')
        } catch (error) {
          console.error('Revalidation failed:', error)
          // Log error but don't fail the request
        }
      }
    },
  })
}

// DELETE /blog-posts/:id - Archive blog post
export const useArchiveBlogPostMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => blogApiRequest.archive(id),
    onSuccess: async () => {
      // Invalidate manage queries
      queryClient.invalidateQueries({ queryKey: ['blog-posts', 'manage'] })

      // Invalidate public queries
      queryClient.invalidateQueries({ queryKey: ['blog-posts', 'public'] })

      // Revalidate SSG cache (with retry logic)
      await revalidateWithRetry('blog-posts')
    },
  })
}
