import { blogController } from '@/controllers/blog.controller'
import { pauseApiHook, requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import {
  BlogPostIdParams,
  BlogPostIdParamsType,
  BlogPostListPaginatedRes,
  BlogPostListPaginatedResType,
  BlogPostListRes,
  BlogPostListResType,
  BlogPostSlugParams,
  BlogPostSlugParamsType,
  BlogPostViewCountRes,
  BlogPostViewCountResType,
  BlogPostWithAuthorRes,
  BlogPostWithAuthorResType,
  CreateBlogPostBody,
  CreateBlogPostBodyType,
  GetBlogPostsManageQuery,
  GetBlogPostsManageQueryType,
  GetBlogPostsPublicQuery,
  GetBlogPostsPublicQueryType,
  UpdateBlogPostBody,
  UpdateBlogPostBodyType
} from '@/schemaValidations/blog-post.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function blogRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // ============= PUBLIC ROUTES =============

  // GET /blog-posts - Get published blog posts with pagination
  fastify.get<{
    Querystring: GetBlogPostsPublicQueryType
    Reply: BlogPostListPaginatedResType
  }>(
    '/',
    {
      schema: {
        querystring: GetBlogPostsPublicQuery,
        response: {
          200: BlogPostListPaginatedRes
        }
      }
    },
    blogController.getBlogPosts
  )

  // GET /blog-posts/:slug - Get blog post by slug
  fastify.get<{
    Params: BlogPostSlugParamsType
    Reply: BlogPostWithAuthorResType
  }>(
    '/:slug',
    {
      schema: {
        params: BlogPostSlugParams,
        response: {
          200: BlogPostWithAuthorRes
        }
      }
    },
    blogController.getBlogPostBySlug
  )

  // POST /blog-posts/:slug/view - Increment view count
  fastify.post<{
    Params: BlogPostSlugParamsType
    Reply: BlogPostViewCountResType
  }>(
    '/:slug/view',
    {
      schema: {
        params: BlogPostSlugParams,
        response: {
          200: BlogPostViewCountRes
        }
      }
    },
    blogController.incrementViewCount
  )

  // ============= MANAGE ROUTES (Owner Only) =============

  // GET /blog-posts/manage - Get all blog posts (Owner only)
  fastify.get<{
    Querystring: GetBlogPostsManageQueryType
    Reply: BlogPostListResType
  }>(
    '/manage',
    {
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, requireOwnerHook], {
        relation: 'and'
      }),
      schema: {
        querystring: GetBlogPostsManageQuery,
        response: {
          200: BlogPostListRes
        }
      }
    },
    blogController.getBlogPostsManage
  )

  // GET /blog-posts/manage/:id - Get blog post by ID (Owner only)
  fastify.get<{
    Params: BlogPostIdParamsType
    Reply: BlogPostWithAuthorResType
  }>(
    '/manage/:id',
    {
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, requireOwnerHook], {
        relation: 'and'
      }),
      schema: {
        params: BlogPostIdParams,
        response: {
          200: BlogPostWithAuthorRes
        }
      }
    },
    blogController.getBlogPostById
  )

  // POST /blog-posts - Create blog post (Owner only)
  fastify.post<{
    Body: CreateBlogPostBodyType
    Reply: BlogPostWithAuthorResType
  }>(
    '/',
    {
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, requireOwnerHook], {
        relation: 'and'
      }),
      schema: {
        body: CreateBlogPostBody,
        response: {
          201: BlogPostWithAuthorRes
        }
      }
    },
    blogController.createBlogPost
  )

  // PUT /blog-posts/:id - Update blog post (Owner only)
  fastify.put<{
    Params: BlogPostIdParamsType
    Body: UpdateBlogPostBodyType
    Reply: BlogPostWithAuthorResType
  }>(
    '/:id',
    {
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, requireOwnerHook], {
        relation: 'and'
      }),
      schema: {
        params: BlogPostIdParams,
        body: UpdateBlogPostBody,
        response: {
          200: BlogPostWithAuthorRes
        }
      }
    },
    blogController.updateBlogPost
  )

  // DELETE /blog-posts/:id - Archive blog post (Owner only)
  fastify.delete<{
    Params: BlogPostIdParamsType
    Reply: { message: string }
  }>(
    '/:id',
    {
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, requireOwnerHook], {
        relation: 'and'
      }),
      schema: {
        params: BlogPostIdParams,
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    blogController.archiveBlogPost
  )
}
