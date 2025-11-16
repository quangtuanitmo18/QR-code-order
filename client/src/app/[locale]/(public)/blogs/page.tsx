import blogApiRequest from '@/apiRequests/blog'
import BlogList from '@/components/blog/blog-list'
import envConfig, { Locale } from '@/config'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'Blog',
  })

  const url = envConfig.NEXT_PUBLIC_URL + `/${params.locale}/blogs`

  return {
    title: t('title') || 'Blog',
    description: t('description') || 'Read our latest blog posts',
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: t('title') || 'Blog',
      description: t('description') || 'Read our latest blog posts',
      url,
      type: 'website',
    },
  }
}

// Generate static params for first page (SSG)
export async function generateStaticParams() {
  // Generate static page for default (page 1)
  // Other pages will be generated on-demand with ISR
  return []
}

export default async function BlogPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams

  // Fetch initial data for SSG (page 1, no filters)
  try {
    await blogApiRequest.getBlogPosts({
      page: 1,
      limit: 10,
    })
  } catch (error) {
    // If fetch fails, page will still render but show loading state
    console.error('Failed to fetch initial blog posts:', error)
  }

  return (
    <main className="container mx-auto space-y-8 px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">Blog</h1>
        <p className="text-lg text-muted-foreground">Discover our latest articles and insights</p>
      </div>
      <BlogList />
    </main>
  )
}
