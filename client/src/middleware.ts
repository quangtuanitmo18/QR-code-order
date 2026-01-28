import { defaultLocale } from '@/config'
import { Role } from '@/constants/type'
import { TokenPayload } from '@/types/jwt.types'
import jwt from 'jsonwebtoken'
import createMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const decodeToken = (token: string) => {
  return jwt.decode(token) as TokenPayload
}

const managePaths = ['/vi/manage', '/en/manage']
const guestPaths = ['/vi/guest', '/en/guest']
const onlyOwnerPaths = ['/vi/manage/accounts', '/en/manage/accounts']
const privatePaths = [...managePaths, ...guestPaths]
const unAuthPaths = ['/vi/manage/login', '/en/manage/login']
const loginPaths = ['/vi/manage/login', '/en/manage/login']

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const handleI18nRouting = createMiddleware(routing)
  const response = handleI18nRouting(request)
  const { pathname, searchParams } = request.nextUrl
  // pathname: /en/manage/dashboard or /vi/manage/dashboard

  // Extract locale from pathname - ensure it's always valid
  const pathnameLocale = pathname.split('/').filter(Boolean)[0]
  const locale = pathnameLocale === 'vi' || pathnameLocale === 'en' ? pathnameLocale : defaultLocale

  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value

  // Check if current path is an unauthenticated path
  const isUnAuthPath = unAuthPaths.some((path) => pathname.startsWith(path))

  // 1. If not logged in then do not allow access to private paths (except unauth paths)
  if (privatePaths.some((path) => pathname.startsWith(path)) && !refreshToken && !isUnAuthPath) {
    const url = new URL(`/${locale}/manage/login`, request.url)
    url.searchParams.set('clearTokens', 'true')
    return NextResponse.redirect(url)
  }

  // 2. If logged in
  if (refreshToken) {
    // 2.1 If trying to access login page, redirect to home
    if (unAuthPaths.some((path) => pathname.startsWith(path))) {
      if (loginPaths.some((path) => pathname.startsWith(path)) && searchParams.get('accessToken')) {
        return response
      }
      // Don't redirect if already at login with clearTokens param (prevent loop)
      if (searchParams.get('clearTokens')) {
        return response
      }
      return NextResponse.redirect(new URL(`/${locale}`, request.url))
      // response.headers.set(
      //   'x-middleware-rewrite',
      //   new URL('/en', request.url).toString()
      // )
      // return response
    }

    // 2.2 If access token has expired
    if (privatePaths.some((path) => pathname.startsWith(path)) && !accessToken) {
      const url = new URL(`/${locale}/manage/refresh-token`, request.url)
      url.searchParams.set('refreshToken', refreshToken)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
      // response.headers.set('x-middleware-rewrite', url.toString())
      // return response
    }

    // 2.3 If not correct role, redirect to home
    const role = decodeToken(refreshToken).role
    // Guest but trying to access owner route
    const isGuestGoToManagePath =
      role === Role.Guest && managePaths.some((path) => pathname.startsWith(path))
    // Not Guest but trying to access guest route
    const isNotGuestGoToGuestPath =
      role !== Role.Guest && guestPaths.some((path) => pathname.startsWith(path))
    // Not Owner but trying to access owner route
    const isNotOwnerGoToOwnerPath =
      role !== Role.Owner && onlyOwnerPaths.some((path) => pathname.startsWith(path))
    if (isGuestGoToManagePath || isNotGuestGoToGuestPath || isNotOwnerGoToOwnerPath) {
      return NextResponse.redirect(new URL(`/${locale}`, request.url))
      // response.headers.set(
      //   'x-middleware-rewrite',
      //   new URL('/', request.url).toString()
      // )
      // return response
    }

    // return NextResponse.next()
    return response
  }
  return response
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/', '/(vi|en)/:path*'],
}
