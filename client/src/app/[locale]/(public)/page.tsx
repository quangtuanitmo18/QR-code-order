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
import { Star } from 'lucide-react'
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
      {/* ══════════ Hero Banner ══════════ */}
      <section className="relative z-10 min-h-[280px] overflow-hidden sm:min-h-[360px] md:min-h-[440px]">
        {/* Gradient overlay instead of flat black */}
        <span className="absolute inset-0 z-10 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        <Image
          src="/banner.png"
          width={1920}
          height={800}
          quality={85}
          priority
          alt="Banner"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative z-20 flex h-full min-h-[280px] flex-col items-center justify-center px-4 py-16 sm:min-h-[360px] sm:px-10 sm:py-20 md:min-h-[440px] md:px-20 md:py-28">
          {/* Decorative accent */}
          <div className="mb-4 h-[2px] w-12 bg-primary sm:mb-6 sm:w-16" />
          <h1 className="animate-fade-in text-center text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            {t('title')}
          </h1>
          <p className="mt-4 max-w-xl animate-slide-up text-center text-sm text-white/80 sm:mt-5 sm:text-base md:text-lg">
            {t('slogan')}
          </p>
          <div className="mt-6 sm:mt-8">
            <Link href="/guest/menu">
              <Button
                size="lg"
                className="rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-glow-lg hover:bg-primary/90 sm:text-base"
              >
                {t('h2')} →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ Reviews Section ══════════ */}
      {reviewStats && reviewStats.totalReviews > 0 && (
        <section className="space-y-6 px-4 py-12 sm:space-y-8 sm:px-6 sm:py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
                Testimonials
              </p>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">{t('reviewsTitle')}</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Overall Rating Card */}
              <Card className="border-border/40 bg-gradient-to-br from-primary/5 to-transparent shadow-premium md:col-span-1">
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <div className="text-5xl font-bold text-primary">
                    {reviewStats.averageOverallRating.toFixed(1)}
                  </div>
                  <div className="mt-3 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 transition-colors duration-300 ${
                          star <= Math.round(reviewStats.averageOverallRating)
                            ? 'fill-primary text-primary drop-shadow-[0_0_4px_rgba(217,169,56,0.5)]'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t('reviewsSummary', { count: reviewStats.totalReviews })}
                  </p>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border-border/40 shadow-premium md:col-span-2">
                <CardContent className="grid grid-cols-2 gap-6 p-8">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t('foodQuality')}
                    </p>
                    <p className="text-2xl font-bold">
                      {reviewStats.averageFoodQuality.toFixed(1)}
                      <span className="text-sm font-normal text-muted-foreground">/5</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t('service')}
                    </p>
                    <p className="text-2xl font-bold">
                      {reviewStats.averageServiceQuality.toFixed(1)}
                      <span className="text-sm font-normal text-muted-foreground">/5</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t('ambiance')}
                    </p>
                    <p className="text-2xl font-bold">
                      {reviewStats.averageAmbiance.toFixed(1)}
                      <span className="text-sm font-normal text-muted-foreground">/5</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t('priceValue')}
                    </p>
                    <p className="text-2xl font-bold">
                      {reviewStats.averagePriceValue.toFixed(1)}
                      <span className="text-sm font-normal text-muted-foreground">/5</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-10 text-center">
              <Link href="/reviews">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-primary/30 px-8 text-primary hover:bg-primary/10"
                >
                  {t('viewAllReviews')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════ Featured Blog Posts ══════════ */}
      {featuredBlogPosts.length > 0 && (
        <section className="border-y border-border/30 bg-muted/30 px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
                Stories
              </p>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">
                {t('featuredArticles')}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredBlogPosts.map((post) => (
                <BlogCard key={post.id} post={post} locale={locale} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/blogs">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-primary/30 px-8 text-primary hover:bg-primary/10"
                >
                  {t('viewAllBlogPosts')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════ Dishes Section ══════════ */}
      <section className="px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              Our Menu
            </p>
            <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">{t('h2')}</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
            {dishList.map((dish, index) => (
              <Link
                href={`/dishes/${generateSlugUrl({
                  name: dish.name,
                  id: dish.id,
                })}`}
                className="group overflow-hidden rounded-2xl border border-border/40 bg-card shadow-premium transition-all hover:-translate-y-1 hover:shadow-premium-lg sm:flex-col"
                key={dish.id}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[4/3]">
                  <Image
                    src={dish.image}
                    width={400}
                    height={300}
                    quality={80}
                    alt={dish.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                  />
                  {/* Price badge overlay */}
                  <div className="absolute bottom-3 right-3 rounded-full bg-background/90 px-3 py-1.5 text-sm font-bold text-primary shadow-lg backdrop-blur-sm">
                    {formatCurrency(dish.price)}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1.5 p-4 sm:p-5">
                  <h3 className="text-base font-semibold leading-snug transition-colors group-hover:text-primary sm:text-lg">
                    {dish.name}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{dish.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
