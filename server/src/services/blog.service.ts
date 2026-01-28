import { blogRepository } from '@/repositories/blog.repository'
import type {
  CreateBlogPostBodyType,
  GetBlogPostsManageQueryType,
  GetBlogPostsPublicQueryType,
  UpdateBlogPostBodyType
} from '@/schemaValidations/blog-post.schema'

// Helper function to auto-generate excerpt from content
// Takes first 150 characters, cuts at word boundary, adds "..." if longer
function generateExcerpt(content: string, maxLength: number = 150): string {
  // Remove leading/trailing whitespace
  const trimmed = content.trim()

  if (trimmed.length <= maxLength) {
    return trimmed
  }

  // Find the last space before maxLength to avoid cutting words
  const truncated = trimmed.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...'
  }

  // If no space found, just truncate (edge case)
  return truncated + '...'
}

export const blogService = {
  // Get published blog posts with pagination (public)
  async getBlogPosts(query: GetBlogPostsPublicQueryType) {
    const { page = 1, limit = 10, category, tag, search, featured } = query

    const result = await blogRepository.findPublishedWithPagination({
      page,
      limit,
      category,
      tag,
      search,
      featured
    })

    return {
      data: result.items,
      pagination: {
        page,
        limit,
        total: result.totalItem,
        totalPages: result.totalPage
      }
    }
  },

  // Get blog post by slug (public)
  async getBlogPostBySlug(slug: string) {
    const post = await blogRepository.findBySlug(slug)
    if (!post) {
      throw new Error('Blog post not found')
    }
    return post
  },

  // Get all blog posts (manage - returns all for client-side pagination)
  async getBlogPostsManage(query?: GetBlogPostsManageQueryType) {
    const options = {
      status: query?.status,
      search: query?.search,
      sortBy: query?.sortBy || 'newest'
    }

    const posts = await blogRepository.findMany(options)
    return posts
  },

  // Get blog post by ID (manage)
  async getBlogPostById(id: number) {
    return await blogRepository.findById(id)
  },

  // Create blog post
  async createBlogPost(data: CreateBlogPostBodyType & { authorId: number }) {
    // Auto-generate excerpt if not provided
    const excerpt = data.excerpt || generateExcerpt(data.content)

    // Create blog post
    const post = await blogRepository.create({
      ...data,
      excerpt,
      authorId: data.authorId
    })

    return post
  },

  // Update blog post
  async updateBlogPost(id: number, data: UpdateBlogPostBodyType) {
    // Auto-generate excerpt if content changed and excerpt not provided
    let excerpt = data.excerpt
    if (data.content && !data.excerpt) {
      // Get current post to check if content changed
      const currentPost = await blogRepository.findById(id)
      if (currentPost.content !== data.content) {
        excerpt = generateExcerpt(data.content)
      }
    }

    const updateData: any = { ...data }
    if (excerpt !== undefined) {
      updateData.excerpt = excerpt
    }

    const post = await blogRepository.update(id, updateData)
    return post
  },

  // Archive blog post (soft delete)
  async archiveBlogPost(id: number) {
    return await blogRepository.archive(id)
  },

  // Increment view count
  async incrementViewCount(slug: string) {
    const result = await blogRepository.incrementViewCount(slug)

    // Return updated view count
    if (result.count > 0) {
      const post = await blogRepository.findBySlug(slug)
      return {
        viewCount: post?.viewCount || 0
      }
    }

    throw new Error('Blog post not found or not published')
  },

  // Get all published slugs (for SSG)
  async getAllPublishedSlugs() {
    const slugs = await blogRepository.findAllPublishedSlugs()
    return slugs.map((item) => ({ slug: item.slug }))
  }
}
