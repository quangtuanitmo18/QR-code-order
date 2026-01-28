import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { BlogPostListPaginatedResType } from '@/schemaValidations/blog-post.schema'
import { format } from 'date-fns'
import { Eye } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type BlogPost = BlogPostListPaginatedResType['data'][0]

interface BlogCardProps {
  post: BlogPost
  locale: string
}

// Helper function to parse tags
function parseTags(tags: string | null): string[] {
  if (!tags) return []
  try {
    return JSON.parse(tags)
  } catch {
    return []
  }
}

export default function BlogCard({ post, locale }: BlogCardProps) {
  const tags = parseTags(post.tags)
  const excerpt = post.excerpt || ''

  return (
    <Link href={`/${locale}/blogs/${post.slug}`}>
      <Card className="group h-full transition-all hover:shadow-lg">
        {post.featuredImage && (
          <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              width={1200}
              height={630}
              quality={80}
              unoptimized
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {post.featured && (
              <div className="absolute right-2 top-2">
                <Badge>Featured</Badge>
              </div>
            )}
          </div>
        )}
        <CardHeader>
          <div className="flex items-center gap-2">
            {post.category && (
              <Badge variant="outline" className="text-xs">
                {post.category}
              </Badge>
            )}
            {post.featured && !post.featuredImage && <Badge className="text-xs">Featured</Badge>}
          </div>
          <CardTitle className="line-clamp-2 group-hover:text-primary">{post.title}</CardTitle>
          {excerpt && <CardDescription className="line-clamp-3">{excerpt}</CardDescription>}
        </CardHeader>
        <CardContent>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 5).map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{tags.length - 5}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            {(post as any).author && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={(post as any).author.avatar || ''} />
                  <AvatarFallback className="text-xs">
                    {((post as any).author.name || '').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{(post as any).author.name}</span>
              </div>
            )}
            {post.publishedAt && (
              <span className="text-xs">{format(new Date(post.publishedAt), 'MMM dd, yyyy')}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span className="text-xs">{post.viewCount}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
