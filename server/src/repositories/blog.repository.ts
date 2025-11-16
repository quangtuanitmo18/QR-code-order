import prisma from '@/database'
import type { CreateBlogPostBodyType } from '@/schemaValidations/blog-post.schema'

// Helper function to generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
}

// Helper function to validate slug uniqueness
export async function validateSlugUnique(slug: string, excludeId?: number): Promise<boolean> {
  const existing = await prisma.blogPost.findFirst({
    where: {
      slug,
      ...(excludeId && { id: { not: excludeId } })
    }
  })
  return !existing
}

// Helper function to generate unique slug (with auto-append number if conflict)
export async function generateUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (!(await validateSlugUnique(slug, excludeId))) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

export const blogRepository = {
  // ============= BLOG POST OPERATIONS =============

  // Create blog post
  async create(data: CreateBlogPostBodyType & { authorId: number; slug?: string }) {
    // Generate slug if not provided
    let slug = data.slug || generateSlug(data.title)

    // Ensure slug is unique
    slug = await generateUniqueSlug(slug)

    // Convert tags array to JSON string if provided
    const tagsJson = data.tags ? JSON.stringify(data.tags) : null

    // Set publishedAt if status is PUBLISHED
    const publishedAt = data.status === 'PUBLISHED' ? new Date() : null

    return await prisma.blogPost.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt || null,
        content: data.content,
        featuredImage: data.featuredImage || null,
        status: data.status,
        featured: data.featured || false,
        category: data.category || null,
        tags: tagsJson,
        authorId: data.authorId,
        publishedAt
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })
  },

  // Find all blog posts (for manage - returns all, no pagination)
  async findMany(options?: {
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    search?: string
    sortBy?: 'newest' | 'oldest' | 'viewCount'
  }) {
    const { status, search, sortBy = 'newest' } = options || {}

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (search) {
      // SQLite doesn't support case-insensitive mode, so we use contains
      // For case-insensitive search, convert to lowercase in application layer if needed
      where.OR = [{ title: { contains: search } }, { content: { contains: search } }]
    }

    // Build orderBy clause
    // Prisma requires array format for multiple fields
    let orderBy: any[] = []
    switch (sortBy) {
      case 'oldest':
        orderBy = [{ publishedAt: 'asc' }, { createdAt: 'asc' }]
        break
      case 'viewCount':
        orderBy = [{ viewCount: 'desc' }]
        break
      case 'newest':
      default:
        orderBy = [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
        break
    }

    return await prisma.blogPost.findMany({
      where,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })
  },

  // Find published blog posts with pagination (for public)
  async findPublishedWithPagination(options: {
    page: number
    limit: number
    category?: string
    tag?: string
    search?: string
    featured?: boolean
  }) {
    const { page, limit, category, tag, search, featured } = options
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      status: 'PUBLISHED'
    }

    if (category) {
      where.category = category
    }

    if (tag) {
      // Tags are stored as JSON string, so we search in the JSON
      where.tags = {
        contains: tag
      }
    }

    if (search) {
      // SQLite doesn't support case-insensitive mode, so we use contains
      // For case-insensitive search, convert to lowercase in application layer if needed
      where.OR = [{ title: { contains: search } }, { content: { contains: search } }]
    }

    if (featured !== undefined) {
      where.featured = featured
    }

    const [items, totalItem] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: [
          { featured: 'desc' }, // Featured posts first
          { publishedAt: 'desc' }
        ],
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      }),
      prisma.blogPost.count({ where })
    ])

    return {
      items,
      totalItem,
      totalPage: Math.ceil(totalItem / limit)
    }
  },

  // Find blog post by slug (for public)
  async findBySlug(slug: string) {
    return await prisma.blogPost.findFirst({
      where: {
        slug,
        status: 'PUBLISHED'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })
  },

  // Find blog post by ID (for manage)
  async findById(id: number) {
    return await prisma.blogPost.findUniqueOrThrow({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })
  },

  // Update blog post
  async update(id: number, data: Partial<CreateBlogPostBodyType> & { slug?: string }) {
    // Handle slug update
    let slug = data.slug
    if (!slug && data.title) {
      // Generate slug from new title if title changed
      slug = generateSlug(data.title)
      // Ensure slug is unique (excluding current post)
      slug = await generateUniqueSlug(slug, id)
    } else if (slug) {
      // If slug provided, ensure it's unique
      slug = await generateUniqueSlug(slug, id)
    }

    // Get current post to check status change
    const currentPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { status: true }
    })

    // Set publishedAt if status changes from DRAFT to PUBLISHED
    let publishedAt: Date | null | undefined = undefined
    if (data.status && currentPost) {
      if (currentPost.status === 'DRAFT' && data.status === 'PUBLISHED') {
        publishedAt = new Date()
      } else if (data.status === 'DRAFT') {
        publishedAt = null
      }
    }

    // Convert tags array to JSON string if provided
    const updateData: any = { ...data }
    if (data.tags !== undefined) {
      updateData.tags = data.tags ? JSON.stringify(data.tags) : null
    }
    if (slug) {
      updateData.slug = slug
    }
    if (publishedAt !== undefined) {
      updateData.publishedAt = publishedAt
    }

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    return await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })
  },

  // Archive blog post (soft delete)
  async archive(id: number) {
    return await prisma.blogPost.update({
      where: { id },
      data: {
        status: 'ARCHIVED'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })
  },

  // Increment view count
  async incrementViewCount(slug: string) {
    return await prisma.blogPost.updateMany({
      where: {
        slug,
        status: 'PUBLISHED'
      },
      data: {
        viewCount: {
          increment: 1
        }
      }
    })
  },

  // Get all published slugs (for SSG)
  async findAllPublishedSlugs() {
    return await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        slug: true
      }
    })
  },

  // Count blog posts
  async count(where?: any) {
    return await prisma.blogPost.count({ where })
  }
}
