import envConfig from '@/config'
import http from '@/lib/http'
import type {
  BlogPostListPaginatedResType,
  BlogPostListResType,
  BlogPostViewCountResType,
  BlogPostWithAuthorResType,
  CreateBlogPostBodyType,
  GetBlogPostsManageQueryType,
  GetBlogPostsPublicQueryType,
  UpdateBlogPostBodyType,
} from '@/schemaValidations/blog-post.schema'

// Server-side helper functions (for SSG/SSR with Next.js cache)
// These functions normalize the response to match the http wrapper format: { payload: { data: {...} } }
const blogApiRequestServer = {
  // GET /blog-posts/:slug - Get blog post by slug (server-side with cache)
  getBlogPostBySlug: async (slug: string, options?: { next?: { revalidate?: number } }) => {
    const response = await fetch(`${envConfig.NEXT_PUBLIC_API_ENDPOINT}/blog-posts/${slug}`, {
      next: options?.next || { revalidate: 3600 },
    })
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch blog post: ${response.status}`)
    }
    const data = await response.json()
    // API returns { data: {...}, message: "..." } directly
    // Normalize to match http wrapper format: { payload: { data: {...}, message: "..." } }
    return {
      payload: data,
    }
  },

  // GET /blog-posts - Get published blog posts (server-side with cache)
  getBlogPosts: async (
    query?: GetBlogPostsPublicQueryType,
    options?: { next?: { revalidate?: number } }
  ) => {
    const params = new URLSearchParams()
    if (query?.page) params.set('page', String(query.page))
    if (query?.limit) params.set('limit', String(query.limit))
    if (query?.category) params.set('category', query.category)
    if (query?.tag) params.set('tag', query.tag)
    if (query?.search) params.set('search', query.search)
    if (query?.featured !== undefined) params.set('featured', String(query.featured))

    const url = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/blog-posts${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url, {
      next: options?.next || { revalidate: 3600 },
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch blog posts: ${response.status}`)
    }
    const data = await response.json()
    // API returns { data: [...], pagination: {...}, message: "..." } directly
    // Normalize to match http wrapper format: { payload: { data: [...], pagination: {...}, message: "..." } }
    return {
      payload: data,
    }
  },
}

const blogApiRequest = {
  // Public endpoints

  // GET /blog-posts - Get published blog posts with pagination
  getBlogPosts: (query?: GetBlogPostsPublicQueryType) => {
    return http.get<BlogPostListPaginatedResType>('blog-posts', {
      params: query,
    })
  },

  // GET /blog-posts/:slug - Get blog post by slug
  getBlogPostBySlug: (slug: string) => {
    return http.get<BlogPostWithAuthorResType>(`blog-posts/${slug}`)
  },

  // POST /blog-posts/:slug/view - Increment view count
  incrementViewCount: (slug: string) => {
    return http.post<BlogPostViewCountResType>(`blog-posts/${slug}/view`, {})
  },

  // Manage endpoints (Owner only)

  // GET /blog-posts/manage - Get all blog posts (returns all for client-side pagination)
  getBlogPostsManage: (query?: GetBlogPostsManageQueryType) => {
    return http.get<BlogPostListResType>('blog-posts/manage', {
      params: query,
    })
  },

  // GET /blog-posts/manage/:id - Get blog post by ID
  getBlogPostById: (id: number) => {
    return http.get<BlogPostWithAuthorResType>(`blog-posts/manage/${id}`)
  },

  // POST /blog-posts - Create blog post
  create: (body: CreateBlogPostBodyType) => {
    return http.post<BlogPostWithAuthorResType>('blog-posts', body)
  },

  // PUT /blog-posts/:id - Update blog post
  update: (id: number, body: UpdateBlogPostBodyType) => {
    return http.put<BlogPostWithAuthorResType>(`blog-posts/${id}`, body)
  },

  // DELETE /blog-posts/:id - Archive blog post
  archive: (id: number) => {
    return http.delete<{ message: string }>(`blog-posts/${id}`)
  },
}

// Export server-side helpers
export { blogApiRequestServer }

export default blogApiRequest
