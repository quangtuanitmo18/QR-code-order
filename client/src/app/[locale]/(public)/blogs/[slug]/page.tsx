import { blogApiRequestServer } from '@/apiRequests/blog'
import BlogDetailClient from '@/app/[locale]/(public)/blogs/[slug]/blog-detail-client'
import BlogContent from '@/components/blog/blog-content'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import envConfig, { Locale } from '@/config'
import { format } from 'date-fns'
import { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { cache } from 'react'

type Props = {
  params: Promise<{ slug: string; locale: Locale }>
}

// Server-side function to fetch blog post by slug
const getBlogPostBySlug = cache(async (slug: string) => {
  try {
    const result = await blogApiRequestServer.getBlogPostBySlug(slug, {
      next: { revalidate: 3600 }, // Revalidate every hour
    })
    return result
  } catch (error) {
    console.error('Failed to fetch blog post:', error)
    return null
  }
})

// Use ISR instead of SSG - pages will be generated on-demand
// This avoids build-time API dependency issues
export const dynamicParams = true // Allow dynamic params not generated at build time
export const revalidate = 3600 // Revalidate every hour (ISR)

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const result = await getBlogPostBySlug(params.slug)
    // blogApiRequestServer normalizes response to { payload: { data: {...}, message: "..." } }
    const post = result?.payload?.data

    if (!post || post.status !== 'PUBLISHED') {
      return {
        title: 'Blog Post Not Found',
      }
    }

    const url = `${envConfig.NEXT_PUBLIC_URL}/${params.locale}/blogs/${post.slug}`
    const excerpt = post.excerpt || post.content.substring(0, 150) + '...'
    const image = post.featuredImage || `${envConfig.NEXT_PUBLIC_URL}/banner.png`
    const parsedTags = post.tags ? JSON.parse(post.tags) : []

    return {
      title: post.title,
      description: excerpt,
      keywords: post.category
        ? [post.category, ...parsedTags].join(', ')
        : parsedTags.length > 0
          ? parsedTags.join(', ')
          : undefined,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: post.title,
        description: excerpt,
        url,
        type: 'article',
        publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
        authors: post.author ? [post.author.name] : undefined,
        section: post.category || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
        siteName:
          envConfig.NEXT_PUBLIC_URL?.replace('https://', '').replace('http://', '') || 'Blog',
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: excerpt,
        images: [image],
        creator: post.author ? `@${post.author.name.replace(/\s+/g, '')}` : undefined,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    }
  } catch (error) {
    return {
      title: 'Blog Post Not Found',
    }
  }
}

export default async function BlogDetailPage(props: Props) {
  const params = await props.params

  try {
    const result = await getBlogPostBySlug(params.slug)

    const post = result?.payload?.data

    if (!post || post.status !== 'PUBLISHED') {
      notFound()
    }

    const tags = post.tags ? JSON.parse(post.tags) : []

    // JSON-LD structured data for SEO
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt || post.content.substring(0, 150),
      image: post.featuredImage || `${envConfig.NEXT_PUBLIC_URL}/banner.png`,
      datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      author: post.author
        ? {
            '@type': 'Person',
            name: post.author.name,
          }
        : undefined,
      publisher: {
        '@type': 'Organization',
        name: envConfig.NEXT_PUBLIC_URL?.replace('https://', '').replace('http://', '') || 'Blog',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${envConfig.NEXT_PUBLIC_URL}/${params.locale}/blogs/${post.slug}`,
      },
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <article className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16">
          {/* Header */}
          <header className="space-y-4">
            <div className="flex items-center gap-2">
              {post.featured && <Badge>Featured</Badge>}
              {post.category && <Badge variant="outline">{post.category}</Badge>}
            </div>

            <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">{post.title}</h1>

            {post.excerpt && <p className="text-lg text-muted-foreground">{post.excerpt}</p>}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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

            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
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
                width={1200}
                height={630}
                quality={80}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority
                unoptimized
              />
            </div>
          )}

          {/* Content */}
          <BlogContent content={post.content} />

          {/* Client-side view count increment */}
          <BlogDetailClient slug={params.slug} />
        </article>
      </>
    )
  } catch (error) {
    notFound()
  }
}
