import { Link } from '@/i18n/routing'
import { Beef } from 'lucide-react'

export default function Footer() {
  return (
    <footer className='w-full p-4 md:p-8 text-muted-foreground border-t'>
      <div className=' flex flex-col items-center justify-between gap-4 md:flex-row md:gap-0'>
        <div className='flex flex-col items-center gap-2 md:flex-row md:gap-4'>
          <Link href='/' className='flex items-center gap-2 ' prefetch={false}>
            <Beef className='h-6 w-6 hover:text-foreground' />
            <span className='text-sm font-medium'>Big Boy Restaurant</span>
          </Link>
          <div className='flex flex-col sm:flex-row items-center gap-4 text-sm'>
            <Link
              href='/term-of-service'
              className='hover:underline'
              prefetch={false}
            >
              Điều khoản dịch vụ
            </Link>
            <Link
              href='/privacy-policy'
              className='hover:underline'
              prefetch={false}
            >
              Chính sách bảo mật
            </Link>
            <Link href='/about' className='hover:underline' prefetch={false}>
              Về chúng tôi
            </Link>
          </div>
        </div>
        <div className='flex items-center gap-4'>
          <Link
            href='https://www.facebook.com'
            target='_blank'
            rel='noopener noreferrer'
            className='text-muted-foreground hover:text-foreground'
            prefetch={false}
          >
            <svg
              role='img'
              viewBox='0 0 24 24'
              className='w-5 h-5 fill-current'
              xmlns='http://www.w3.org/2000/svg'
            >
              <title>Facebook</title>
              <path d='M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z' />
            </svg>
            <span className='sr-only'>Facebook</span>
          </Link>
          <Link
            href='https://www.youtube.com'
            target='_blank'
            rel='noopener noreferrer'
            className='text-muted-foreground hover:text-foreground'
            prefetch={false}
          >
            <svg
              role='img'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
              className='w-5 h-5 fill-current'
            >
              <title>YouTube</title>
              <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
            </svg>
            <span className='sr-only'>YouTube</span>
          </Link>
          <Link
            href='https://www.tiktok.com'
            target='_blank'
            rel='noopener noreferrer'
            className='text-muted-foreground hover:text-foreground'
            prefetch={false}
          >
            <svg
              role='img'
              viewBox='0 0 24 24'
              className='w-5 h-5 fill-current'
              xmlns='http://www.w3.org/2000/svg'
            >
              <title>TikTok</title>
              <path d='M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' />
            </svg>
            <span className='sr-only'>TikTok</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
