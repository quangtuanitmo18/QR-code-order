import blogApiRequest from '@/apiRequests/blog'
import dishApiRequest from '@/apiRequests/dish'
import reviewApiRequest from '@/apiRequests/review'
import BlogCard from '@/components/blog/blog-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import envConfig, { Locale } from '@/config'
import { Link } from '@/i18n/routing'
import { htmlToTextForDescription } from '@/lib/server-utils'
import { formatCurrency, generateSlugUrl } from '@/lib/utils'
import { DishListResType } from '@/schemaValidations/dish.schema'
import { ArrowRight, Star } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params

  const { locale } = params

  const t = await getTranslations({ locale, namespace: 'HomePage' })
  const url = envConfig.NEXT_PUBLIC_URL + `/${locale}`

  return {
    title: t('title'),
    description: htmlToTextForDescription(t('description')),
    alternates: {
      canonical: url,
    },
  }
}

export default async function Home(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params

  const { locale } = params

  setRequestLocale(locale)
  const t = await getTranslations('HomePage')
  let dishList: DishListResType['data'] = []
  let reviewStats = null
  let featuredBlogPosts: any[] = []

  try {
    const [dishResult, statsResult, blogResult] = await Promise.all([
      dishApiRequest.list(),
      reviewApiRequest.getStats().catch(() => null),
      blogApiRequest.getBlogPosts({ page: 1, limit: 3, featured: true }).catch(() => ({
        payload: { data: [] },
      })),
    ])
    dishList = dishResult.payload.data
    if (statsResult) {
      reviewStats = statsResult.payload.data
    }
    featuredBlogPosts = blogResult.payload.data || []
  } catch (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-destructive">Something went wrong</h2>
        <p className="text-muted-foreground">Please try refreshing the page later.</p>
      </div>
    )
  }
  return (
    <div className="w-full">
      {/* Hero Banner */}
      <section className="relative z-10 min-h-[300px] overflow-hidden sm:min-h-[400px] md:min-h-[500px]">
        {/* Modern dark gradient overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-background/95 via-background/70 to-background/30 dark:from-background/95 dark:via-background/80 dark:to-background/40"></div>
        <Image
          src="/banner.png"
          width={1920}
          height={800}
          quality={85}
          priority
          alt="Banner"
          className="duration-[20s] absolute inset-0 h-full w-full object-cover transition-transform ease-out hover:scale-105"
        />
        <div className="relative z-20 flex h-full min-h-[300px] flex-col justify-center px-4 py-16 sm:min-h-[400px] sm:px-10 sm:py-20 md:min-h-[500px] md:px-20 md:py-24">
          <div className="max-w-2xl animate-fade-in-up">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              {t('title')}
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:mt-6 sm:text-lg md:text-xl">
              {t('slogan')}
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/guest/menu">
                <Button size="lg" className="w-full sm:w-auto">
                  Order Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {reviewStats && reviewStats.totalReviews > 0 && (
        <section className="py-12 sm:py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 md:px-8">
            <div className="mb-10 text-center sm:mb-12">
              <h2 className="text-gradient inline-block text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {t('reviewsTitle')}
              </h2>
              <p className="mt-4 text-muted-foreground">Don&apos;t just take our word for it.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Overall Rating Card */}
              <Card className="glass-card border-primary/20 bg-primary/5 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-primary/10 md:col-span-1">
                <CardContent className="flex h-full flex-col items-center justify-center p-8">
                  <div className="text-6xl font-black text-primary">
                    {reviewStats.averageOverallRating.toFixed(1)}
                  </div>
                  <div className="mt-4 flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 transition-colors duration-300 ${
                          star <= Math.round(reviewStats.averageOverallRating)
                            ? 'fill-accent text-accent'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-center text-sm font-medium text-muted-foreground">
                    {t('reviewsSummary', { count: reviewStats.totalReviews })}
                  </p>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="glass-card md:col-span-2">
                <CardContent className="grid grid-cols-2 gap-x-4 gap-y-8 p-8">
                  <div className="space-y-2">
                    <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      {t('foodQuality')}
                    </p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">
                      {reviewStats.averageFoodQuality.toFixed(1)}
                      <span className="text-lg text-muted-foreground/50">/5</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      {t('service')}
                    </p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">
                      {reviewStats.averageServiceQuality.toFixed(1)}
                      <span className="text-lg text-muted-foreground/50">/5</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      {t('ambiance')}
                    </p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">
                      {reviewStats.averageAmbiance.toFixed(1)}
                      <span className="text-lg text-muted-foreground/50">/5</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      {t('priceValue')}
                    </p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">
                      {reviewStats.averagePriceValue.toFixed(1)}
                      <span className="text-lg text-muted-foreground/50">/5</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-10 flex justify-center">
              <Link href="/reviews">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-primary/20 hover:bg-primary/5"
                >
                  {t('viewAllReviews')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Blog Posts Section */}
      {featuredBlogPosts.length > 0 && (
        <section className="bg-secondary/50 py-12 dark:bg-card/50 sm:py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 md:px-8">
            <div className="mb-10 text-center sm:mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {t('featuredArticles')}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {featuredBlogPosts.map((post) => (
                <BlogCard key={post.id} post={post} locale={locale} />
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Link href="/blogs">
                <Button variant="outline" size="lg" className="rounded-full">
                  {t('viewAllBlogPosts')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Dishes Section */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-10 text-center sm:mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{t('h2')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4">
            {dishList.map((dish) => (
              <Link
                href={`/dishes/${generateSlugUrl({
                  name: dish.name,
                  id: dish.id,
                })}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-border/50"
                key={dish.id}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <Image
                    src={dish.image}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    quality={80}
                    alt={dish.name}
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                  />
                  {/* Floating Price Badge */}
                  <div className="absolute bottom-3 right-3 z-20 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="rounded-full bg-primary px-3 py-1 font-bold text-primary-foreground shadow-lg">
                      {formatCurrency(dish.price)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold tracking-tight transition-colors duration-200 group-hover:text-primary sm:text-xl">
                    {dish.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
                    {dish.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-lg font-black text-primary transition-colors duration-300 group-hover:opacity-0">
                      {formatCurrency(dish.price)}
                    </p>
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
