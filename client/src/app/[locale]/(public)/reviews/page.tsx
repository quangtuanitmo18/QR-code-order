import ReviewsClient from '@/app/[locale]/(public)/reviews/reviews-client'
import envConfig, { Locale } from '@/config'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'Reviews',
  })

  const url = envConfig.NEXT_PUBLIC_URL + `/${params.locale}/reviews`

  return {
    title: t('title') || 'Customer Reviews',
    description: t('description') || 'Read what our customers say about their dining experience',
    alternates: {
      canonical: url,
    },
  }
}

export default function ReviewsPage() {
  return <ReviewsClient />
}
