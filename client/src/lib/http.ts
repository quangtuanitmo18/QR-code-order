import envConfig, { defaultLocale } from '@/config'
import { redirect } from '@/i18n/routing'
import {
  getAccessTokenFromLocalStorage,
  normalizePath,
  removeTokensFromLocalStorage,
  setAccessTokenToLocalStorage,
  setRefreshTokenToLocalStorage,
} from '@/lib/utils'
import { LoginResType } from '@/schemaValidations/auth.schema'
import Cookies from 'js-cookie'
type CustomOptions = Omit<RequestInit, 'method'> & {
  baseUrl?: string | undefined
  params?: Record<string, any>
}

const ENTITY_ERROR_STATUS = 422
const AUTHENTICATION_ERROR_STATUS = 401

type EntityErrorPayload = {
  message: string
  errors: {
    field: string
    message: string
  }[]
}

export class HttpError extends Error {
  status: number
  payload: {
    message: string
    [key: string]: any
  }
  constructor({
    status,
    payload,
    message = 'Lỗi HTTP',
  }: {
    status: number
    payload: any
    message?: string
  }) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

export class EntityError extends HttpError {
  status: typeof ENTITY_ERROR_STATUS
  payload: EntityErrorPayload
  constructor({
    status,
    payload,
  }: {
    status: typeof ENTITY_ERROR_STATUS
    payload: EntityErrorPayload
  }) {
    super({ status, payload, message: 'Lỗi thực thể' })
    this.status = status
    this.payload = payload
  }
}

let clientLogoutRequest: null | Promise<any> = null
const isClient = typeof window !== 'undefined'
const request = async <Response>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  options?: CustomOptions | undefined
) => {
  let body: FormData | string | undefined = undefined
  if (options?.body instanceof FormData) {
    body = options.body
  } else if (options?.body) {
    body = JSON.stringify(options.body)
  }
  const baseHeaders: {
    [key: string]: string
  } =
    body instanceof FormData
      ? {}
      : body !== undefined
        ? {
            'Content-Type': 'application/json',
          }
        : {}
  if (isClient) {
    const accessToken = getAccessTokenFromLocalStorage()
    if (accessToken) {
      baseHeaders.Authorization = `Bearer ${accessToken}`
    }
  }
  // Nếu không truyền baseUrl (hoặc baseUrl = undefined) thì lấy từ envConfig.NEXT_PUBLIC_API_ENDPOINT
  // Nếu truyền baseUrl thì lấy giá trị truyền vào, truyền vào '' thì đồng nghĩa với việc chúng ta gọi API đến Next.js Server

  const baseUrl =
    options?.baseUrl === undefined ? envConfig.NEXT_PUBLIC_API_ENDPOINT : options.baseUrl

  let fullUrl = `${baseUrl}/${normalizePath(url)}`
  if (options?.params) {
    const queryString = new URLSearchParams(
      Object.entries(options.params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)])
    ).toString()
    if (queryString) {
      fullUrl += `?${queryString}`
    }
  }

  console.log('Requesting:', method, fullUrl)
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      ...baseHeaders,
      ...options?.headers,
    } as any,
    body,
    method,
  })

  const payload: Response = await res.json()
  const data = {
    status: res.status,
    payload,
  }

  // Interceptor là nời chúng ta xử lý request và response trước khi trả về cho phía component
  if (!res.ok) {
    if (res.status === ENTITY_ERROR_STATUS) {
      throw new EntityError(
        data as {
          status: 422
          payload: EntityErrorPayload
        }
      )
    } else if (res.status === AUTHENTICATION_ERROR_STATUS) {
      console.error('[HTTP] ❌ 401 Unauthorized error:', {
        url: fullUrl,
        method,
        pathname: isClient ? window.location.pathname : 'server',
        timestamp: new Date().toISOString(),
      })
      if (isClient) {
        // Try to get locale from URL first, then cookie, then fallback to default
        const pathLocale = window.location.pathname.split('/')[1]
        const cookieLocale = Cookies.get('NEXT_LOCALE')
        const locale =
          (['en', 'vi', 'ru'].includes(pathLocale) ? pathLocale : cookieLocale) || defaultLocale

        console.log('[HTTP] 🔄 Processing 401 - redirecting to login', {
          pathLocale,
          cookieLocale,
          finalLocale: locale,
          currentPath: window.location.pathname,
        })

        if (!clientLogoutRequest) {
          console.log('[HTTP] 📤 Calling logout API...')
          clientLogoutRequest = fetch('/api/auth/logout', {
            method: 'POST',
            body: null, // Logout mình sẽ cho phép luôn luôn thành công
            headers: {
              ...baseHeaders,
            } as any,
          })
          try {
            await clientLogoutRequest
            console.log('[HTTP] ✅ Logout API success')
          } catch (error) {
            console.error('[HTTP] ❌ Logout API error:', error)
          } finally {
            removeTokensFromLocalStorage()
            clientLogoutRequest = null
            // Redirect về trang login có thể dẫn đến loop vô hạn
            // Nếu không được xử lý đúng cách
            // Check if already at login page to prevent loop
            const currentPath = window.location.pathname
            // Chỉ redirect nếu đang ở các trang cần xác thực (manage hoặc guest)
            // Nếu ở trang public, chỉ cần xóa token (đã làm ở trên) và không chuyển hướng
            if (currentPath.includes('/manage') && !currentPath.includes('/manage/login')) {
              location.href = `/${locale}/manage/login`
            } else if (currentPath.includes('/guest')) {
              // Guest routes redirect to homepage to re-login
              location.href = `/${locale}`
            }
          }
        }
      } else {
        // Đây là trường hợp khi mà chúng ta vẫn còn access token (còn hạn)
        // Và chúng ta gọi API ở Next.js Server (Route Handler , Server Component) đến Server Backend
        const accessToken = (options?.headers as any)?.Authorization.split('Bearer ')[1]
        const locale = Cookies.get('NEXT_LOCALE')
        redirect({
          href: `/manage/login?accessToken=${accessToken}`,
          locale: locale ?? defaultLocale,
        })
      }
    } else {
      throw new HttpError(data)
    }
  }
  // Đảm bảo logic dưới đây chỉ chạy ở phía client (browser)
  if (isClient) {
    const normalizeUrl = normalizePath(url)
    if (['api/auth/login', 'api/guest/auth/login'].includes(normalizeUrl)) {
      const { accessToken, refreshToken } = (payload as LoginResType).data
      setAccessTokenToLocalStorage(accessToken)
      setRefreshTokenToLocalStorage(refreshToken)
    } else if ('api/auth/token' === normalizeUrl) {
      const { accessToken, refreshToken } = payload as {
        accessToken: string
        refreshToken: string
      }
      setAccessTokenToLocalStorage(accessToken)
      setRefreshTokenToLocalStorage(refreshToken)
    } else if (['api/auth/logout', 'api/guest/auth/logout'].includes(normalizeUrl)) {
      removeTokensFromLocalStorage()
    }
  }
  return data
}

const http = {
  get<Response>(url: string, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('GET', url, options)
  },
  post<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('POST', url, { ...options, body })
  },
  put<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('PUT', url, { ...options, body })
  },
  patch<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('PATCH', url, { ...options, body })
  },
  delete<Response>(url: string, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('DELETE', url, { ...options })
  },
}

export default http
