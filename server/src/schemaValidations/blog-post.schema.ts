import z from 'zod'

// Create/Update Blog Post Body
export const CreateBlogPostBody = z.object({
  title: z.string().min(10).max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(), // lowercase, hyphens only, no special chars
  excerpt: z.string().max(500).optional(), // Max 500 chars, auto-generated if not provided
  content: z.string().min(100), // Markdown format, min 100 chars
  featuredImage: z.string().url().optional(), // Optional but recommended
  status: z.enum(['DRAFT', 'PUBLISHED']),
  featured: z.boolean().optional().default(false),
  category: z.string().max(50).optional(), // Free-form string, not enum
  tags: z.array(z.string().max(30)).max(10).optional() // Max 10 tags, each max 30 chars
})

export type CreateBlogPostBodyType = z.TypeOf<typeof CreateBlogPostBody>

export const UpdateBlogPostBody = CreateBlogPostBody
export type UpdateBlogPostBodyType = CreateBlogPostBodyType

// Blog Post Schema (response)
export const BlogPostSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable(),
  content: z.string(),
  featuredImage: z.string().nullable(),
  status: z.string(), // DRAFT, PUBLISHED, ARCHIVED
  featured: z.boolean(),
  viewCount: z.number(),
  category: z.string().nullable(),
  tags: z.string().nullable(), // JSON string
  authorId: z.number(),
  publishedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type BlogPostSchemaType = z.TypeOf<typeof BlogPostSchema>

// Blog Post with Author (for detail page)
export const BlogPostWithAuthorSchema = BlogPostSchema.extend({
  author: z.object({
    name: z.string(),
    avatar: z.string().nullable()
  })
})

export type BlogPostWithAuthorSchemaType = z.TypeOf<typeof BlogPostWithAuthorSchema>

// Response schemas
export const BlogPostRes = z.object({
  data: BlogPostSchema,
  message: z.string()
})

export type BlogPostResType = z.TypeOf<typeof BlogPostRes>

export const BlogPostWithAuthorRes = z.object({
  data: BlogPostWithAuthorSchema,
  message: z.string()
})

export type BlogPostWithAuthorResType = z.TypeOf<typeof BlogPostWithAuthorRes>

export const BlogPostListRes = z.object({
  data: z.array(BlogPostSchema),
  message: z.string()
})

export type BlogPostListResType = z.TypeOf<typeof BlogPostListRes>

// Paginated response for public list
export const BlogPostListPaginatedRes = z.object({
  data: z.array(BlogPostSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  }),
  message: z.string().optional()
})

export type BlogPostListPaginatedResType = z.TypeOf<typeof BlogPostListPaginatedRes>

// Query params for public endpoint
export const GetBlogPostsPublicQuery = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().lte(50).default(10),
  category: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional()
})

export type GetBlogPostsPublicQueryType = z.TypeOf<typeof GetBlogPostsPublicQuery>

// Query params for manage endpoint
export const GetBlogPostsManageQuery = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['newest', 'oldest', 'viewCount']).optional().default('newest')
})

export type GetBlogPostsManageQueryType = z.TypeOf<typeof GetBlogPostsManageQuery>

// Params schemas
export const BlogPostSlugParams = z.object({
  slug: z.string()
})

export type BlogPostSlugParamsType = z.TypeOf<typeof BlogPostSlugParams>

export const BlogPostIdParams = z.object({
  id: z.coerce.number()
})

export type BlogPostIdParamsType = z.TypeOf<typeof BlogPostIdParams>

// View count response
export const BlogPostViewCountRes = z.object({
  data: z.object({
    viewCount: z.number()
  }),
  message: z.string()
})

export type BlogPostViewCountResType = z.TypeOf<typeof BlogPostViewCountRes>
