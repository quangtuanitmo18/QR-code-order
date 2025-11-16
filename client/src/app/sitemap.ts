import blogApiRequest from '@/apiRequests/blog'
import dishApiRequest from '@/apiRequests/dish'
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
      dishApiRequest.list().catch(() => ({ payload: { data: [] } })),
      blogApiRequest.getBlogPosts({ page: 1, limit: 1000 }).catch(() => ({
        payload: { data: [] },
      })),
    ])

    const dishList = dishResult.payload.data
    const blogList = blogResult.payload.data

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
