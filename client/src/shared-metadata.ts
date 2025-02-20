import envConfig from '@/config'

export const baseOpenGraph = {
  locale: 'en_US',
  alternateLocale: ['vi_VN'],
  type: 'website',
  siteName: 'Bigboy Restaurant',
  images: [
    {
      url: `${envConfig.NEXT_PUBLIC_URL}/banner.png`
    }
  ]
}
