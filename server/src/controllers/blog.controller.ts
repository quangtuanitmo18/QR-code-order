import {
  BlogPostIdParamsType,
  BlogPostSlugParamsType,
  CreateBlogPostBodyType,
  GetBlogPostsManageQueryType,
  GetBlogPostsPublicQueryType,
  UpdateBlogPostBodyType
} from '@/schemaValidations/blog-post.schema'
import { blogService } from '@/services/blog.service'
import { FastifyReply, FastifyRequest } from 'fastify'

export const blogController = {
  // GET /blog-posts - Get published blog posts (public)
  async getBlogPosts(
    request: FastifyRequest<{
      Querystring: GetBlogPostsPublicQueryType
    }>,
    reply: FastifyReply
  ) {
    try {
      const result = await blogService.getBlogPosts(request.query)

      return reply.status(200).send({
        data: result.data,
        pagination: result.pagination,
        message: 'Blog posts retrieved successfully'
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        message: 'Failed to get blog posts'
      })
    }
  },

  // GET /blog-posts/:slug - Get blog post by slug (public)
  async getBlogPostBySlug(
    request: FastifyRequest<{
      Params: BlogPostSlugParamsType
    }>,
    reply: FastifyReply
  ) {
    try {
      const post = await blogService.getBlogPostBySlug(request.params.slug)

      return reply.status(200).send({
        data: post,
        message: 'Blog post retrieved successfully'
      })
    } catch (error: any) {
      request.log.error(error)
      if (error.message === 'Blog post not found') {
        return reply.status(404).send({
          message: 'Blog post not found'
        })
      }
      return reply.status(500).send({
        message: 'Failed to get blog post'
      })
    }
  },

  // GET /blog-posts/manage - Get all blog posts (Owner only)
  async getBlogPostsManage(
    request: FastifyRequest<{
      Querystring: GetBlogPostsManageQueryType
    }>,
    reply: FastifyReply
  ) {
    try {
      const posts = await blogService.getBlogPostsManage(request.query)

      return reply.status(200).send({
        data: posts,
        message: 'Blog posts retrieved successfully'
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        message: 'Failed to get blog posts'
      })
    }
  },

  // GET /blog-posts/manage/:id - Get blog post by ID (Owner only)
  async getBlogPostById(
    request: FastifyRequest<{
      Params: BlogPostIdParamsType
    }>,
    reply: FastifyReply
  ) {
    try {
      const post = await blogService.getBlogPostById(request.params.id)

      return reply.status(200).send({
        data: post,
        message: 'Blog post retrieved successfully'
      })
    } catch (error: any) {
      request.log.error(error)
      if (error.code === 'P2025') {
        // Prisma not found error
        return reply.status(404).send({
          message: 'Blog post not found'
        })
      }
      return reply.status(500).send({
        message: 'Failed to get blog post'
      })
    }
  },

  // POST /blog-posts - Create blog post (Owner only)
  async createBlogPost(
    request: FastifyRequest<{
      Body: CreateBlogPostBodyType
    }>,
    reply: FastifyReply
  ) {
    try {
      const accountId = (request as any).decodedAccessToken?.userId

      if (!accountId) {
        return reply.status(401).send({
          message: 'Unauthorized'
        })
      }

      const post = await blogService.createBlogPost({
        ...request.body,
        authorId: accountId
      })

      return reply.status(201).send({
        data: post,
        message: 'Blog post created successfully'
      })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(500).send({
        message: 'Failed to create blog post'
      })
    }
  },

  // PUT /blog-posts/:id - Update blog post (Owner only)
  async updateBlogPost(
    request: FastifyRequest<{
      Params: BlogPostIdParamsType
      Body: UpdateBlogPostBodyType
    }>,
    reply: FastifyReply
  ) {
    try {
      const post = await blogService.updateBlogPost(request.params.id, request.body)

      return reply.status(200).send({
        data: post,
        message: 'Blog post updated successfully'
      })
    } catch (error: any) {
      request.log.error(error)
      if (error.code === 'P2025') {
        return reply.status(404).send({
          message: 'Blog post not found'
        })
      }
      return reply.status(500).send({
        message: 'Failed to update blog post'
      })
    }
  },

  // DELETE /blog-posts/:id - Archive blog post (Owner only)
  async archiveBlogPost(
    request: FastifyRequest<{
      Params: BlogPostIdParamsType
    }>,
    reply: FastifyReply
  ) {
    try {
      await blogService.archiveBlogPost(request.params.id)

      return reply.status(200).send({
        message: 'Blog post archived successfully'
      })
    } catch (error: any) {
      request.log.error(error)
      if (error.code === 'P2025') {
        return reply.status(404).send({
          message: 'Blog post not found'
        })
      }
      return reply.status(500).send({
        message: 'Failed to archive blog post'
      })
    }
  },

  // POST /blog-posts/:slug/view - Increment view count (public)
  async incrementViewCount(
    request: FastifyRequest<{
      Params: BlogPostSlugParamsType
    }>,
    reply: FastifyReply
  ) {
    try {
      const result = await blogService.incrementViewCount(request.params.slug)

      return reply.status(200).send({
        data: result,
        message: 'View count updated successfully'
      })
    } catch (error: any) {
      request.log.error(error)
      if (error.message === 'Blog post not found or not published') {
        return reply.status(404).send({
          message: 'Blog post not found'
        })
      }
      return reply.status(500).send({
        message: 'Failed to increment view count'
      })
    }
  }
}
