import envConfig, { locales } from '@/config'
import { generateSlugUrl } from '@/lib/utils'
import type { MetadataRoute } from 'next'

const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: '',
    changeFrequency: 'daily',
    priority: 1,
  },
  {
    url: '/manage/login',
    changeFrequency: 'yearly',
    priority: 0.5,
  },
  {
    url: '/blogs',
    changeFrequency: 'daily',
    priority: 0.8,
  },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [dishResult, blogResult] = await Promise.all([
      fetch(`${envConfig.NEXT_PUBLIC_API_ENDPOINT}/dishes`, {
        signal: AbortSignal.timeout(5000),
      })
        .then(async (res) => ({ payload: await res.json() }))
        .catch(() => ({ payload: { data: [] as any[] } })),
      fetch(`${envConfig.NEXT_PUBLIC_API_ENDPOINT}/blog-posts?page=1&limit=1000`, {
        signal: AbortSignal.timeout(5000),
      })
        .then(async (res) => ({ payload: await res.json() }))
        .catch(() => ({ payload: { data: [] as any[] } })),
    ])

    const dishList = (dishResult.payload?.data || []) as any[]
    const blogList = (blogResult.payload?.data || []) as any[]

    const localizeStaticSiteMap = locales.reduce((acc, locale) => {
      return [
        ...acc,
        ...staticRoutes.map((route) => {
          return {
            ...route,
            url: `${envConfig.NEXT_PUBLIC_URL}/${locale}${route.url}`,
            lastModified: new Date(),
          }
        }),
      ]
    }, [] as MetadataRoute.Sitemap)

    const localizeDishSiteMap = locales.reduce((acc, locale) => {
      const dishListSiteMap: MetadataRoute.Sitemap = dishList.map((dish) => {
        return {
          url: `${envConfig.NEXT_PUBLIC_URL}/${locale}/dishes/${generateSlugUrl({
            id: dish.id,
            name: dish.name,
          })}`,
          lastModified: dish.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.9,
        }
      })
      return [...acc, ...dishListSiteMap]
    }, [] as MetadataRoute.Sitemap)

    const localizeBlogSiteMap = locales.reduce((acc, locale) => {
      const blogListSiteMap: MetadataRoute.Sitemap = blogList.map((post) => {
        return {
          url: `${envConfig.NEXT_PUBLIC_URL}/${locale}/blogs/${post.slug}`,
          lastModified: post.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.8,
        }
      })
      return [...acc, ...blogListSiteMap]
    }, [] as MetadataRoute.Sitemap)

    return [...localizeStaticSiteMap, ...localizeDishSiteMap, ...localizeBlogSiteMap]
  } catch (error) {
    return staticRoutes.map((route) => ({
      ...route,
      url: `${envConfig.NEXT_PUBLIC_URL}${route.url}`,
      lastModified: new Date(),
    }))
  }
}
