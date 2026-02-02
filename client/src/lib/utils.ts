import authApiRequest from '@/apiRequests/auth'
import guestApiRequest from '@/apiRequests/guest'
import { toast } from '@/components/ui/use-toast'
import envConfig, { defaultLocale } from '@/config'
import { DishStatus, OrderStatus, Role, TableStatus } from '@/constants/type'
import { EntityError } from '@/lib/http'
import { TokenPayload } from '@/types/jwt.types'
import { type ClassValue, clsx } from 'clsx'
import { format } from 'date-fns'
import { jwtDecode } from 'jwt-decode'
import { BookX, CookingPot, HandCoins, Loader, Truck } from 'lucide-react'
import { UseFormSetError } from 'react-hook-form'
import slugify from 'slugify'
import { io } from 'socket.io-client'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const normalizePath = (path: string) => {
  return path.startsWith('/') ? path.slice(1) : path
}

export const handleErrorApi = ({
  error,
  setError,
  duration,
}: {
  error: any
  setError?: UseFormSetError<any>
  duration?: number
}) => {
  if (error instanceof EntityError && setError) {
    error.payload.errors.forEach((item) => {
      setError(item.field, {
        type: 'server',
        message: item.message,
      })
    })
  } else {
    toast({
      title: 'Lỗi',
      description: error?.payload?.message ?? 'Lỗi không xác định',
      variant: 'destructive',
      duration: duration ?? 5000,
    })
  }
}

const isBrowser = typeof window !== 'undefined'

export const getAccessTokenFromLocalStorage = () =>
  isBrowser ? localStorage.getItem('accessToken') : null

export const getRefreshTokenFromLocalStorage = () =>
  isBrowser ? localStorage.getItem('refreshToken') : null
export const setAccessTokenToLocalStorage = (value: string) =>
  isBrowser && localStorage.setItem('accessToken', value)

export const setRefreshTokenToLocalStorage = (value: string) =>
  isBrowser && localStorage.setItem('refreshToken', value)
export const removeTokensFromLocalStorage = () => {
  isBrowser && localStorage.removeItem('accessToken')
  isBrowser && localStorage.removeItem('refreshToken')
}
export const checkAndRefreshToken = async (param?: {
  onError?: () => void
  onSuccess?: () => void
  force?: boolean
}) => {
  // Không nên đưa logic lấy access và refresh token ra khỏi cái function `checkAndRefreshToken`
  // Vì để mỗi lần mà checkAndRefreshToken() được gọi thì chúng ta se có một access và refresh token mới
  // Tránh hiện tượng bug nó lấy access và refresh token cũ ở lần đầu rồi gọi cho các lần tiếp theo
  const accessToken = getAccessTokenFromLocalStorage()
  const refreshToken = getRefreshTokenFromLocalStorage()
  // Chưa đăng nhập thì cũng không cho chạy
  if (!accessToken || !refreshToken) {
    console.log('[checkAndRefreshToken] ⚠️ No tokens found, skipping refresh')
    return
  }
  const decodedAccessToken = decodeToken(accessToken)
  const decodedRefreshToken = decodeToken(refreshToken)
  // Thời điểm hết hạn của token là tính theo epoch time (s)
  // Còn khi các bạn dùng cú pháp new Date().getTime() thì nó sẽ trả về epoch time (ms)
  const now = Math.round(new Date().getTime() / 1000)
  const accessTokenExpiresIn = decodedAccessToken.exp - now
  const refreshTokenExpiresIn = decodedRefreshToken.exp - now
  
  
  // trường hợp refresh token hết hạn thì cho logout
  if (decodedRefreshToken.exp <= now) {
    console.error('[checkAndRefreshToken] ❌ Refresh token expired!', {
      refreshTokenExpiresIn: `${refreshTokenExpiresIn}s`,
      exp: decodedRefreshToken.exp,
      now,
    })
    removeTokensFromLocalStorage()
    return param?.onError && param.onError()
  }
  // Ví dụ access token của chúng ta có thời gian hết hạn là 10s
  // thì mình sẽ kiểm tra còn 1/3 thời gian (3s) thì mình sẽ cho refresh token lại
  // Thời gian còn lại sẽ tính dựa trên công thức: decodedAccessToken.exp - now
  // Thời gian hết hạn của access token dựa trên công thức: decodedAccessToken.exp - decodedAccessToken.iat
  const shouldRefresh =
    param?.force ||
    decodedAccessToken.exp - now < (decodedAccessToken.exp - decodedAccessToken.iat) / 3

  if (shouldRefresh) {
    console.log('[checkAndRefreshToken] 🔄 Refreshing token...', {
      reason: param?.force ? 'forced' : 'access token expiring soon',
      role: decodedRefreshToken.role,
    })
    // Gọi API refresh token
    try {
      const role = decodedRefreshToken.role
      const res =
        role === Role.Guest
          ? await guestApiRequest.refreshToken()
          : await authApiRequest.refreshToken()
      setAccessTokenToLocalStorage(res.payload.data.accessToken)
      setRefreshTokenToLocalStorage(res.payload.data.refreshToken)
      console.log('[checkAndRefreshToken] ✅ Token refresh API success')
      param?.onSuccess && param.onSuccess()
    } catch (error: any) {
      console.error('[checkAndRefreshToken] ❌ Token refresh API failed:', {
        error: error?.message || error,
        status: error?.status,
        role: decodedRefreshToken.role,
        stack: error?.stack,
      })
      param?.onError && param.onError()
    }
  } 
}

export const formatCurrency = (number: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(number)
}

export const getVietnameseDishStatus = (status: (typeof DishStatus)[keyof typeof DishStatus]) => {
  switch (status) {
    case DishStatus.Available:
      return 'Có sẵn'
    case DishStatus.Unavailable:
      return 'Không có sẵn'
    default:
      return 'Ẩn'
  }
}

export const getDishStatus = (status: (typeof DishStatus)[keyof typeof DishStatus]) => {
  switch (status) {
    case DishStatus.Available:
      return 'Available'
    case DishStatus.Unavailable:
      return 'Unavailable'
    default:
      return 'Hidden'
  }
}

export const getOrderStatus = (status: (typeof OrderStatus)[keyof typeof OrderStatus]) => {
  switch (status) {
    case OrderStatus.Delivered:
      return 'Delivered'
    case OrderStatus.Paid:
      return 'Paid'
    case OrderStatus.Pending:
      return 'Pending'
    case OrderStatus.Processing:
      return 'Processing'
    default:
      return 'Rejected'
  }
}

export const getVietnameseOrderStatus = (
  status: (typeof OrderStatus)[keyof typeof OrderStatus]
) => {
  switch (status) {
    case OrderStatus.Delivered:
      return 'Đã phục vụ'
    case OrderStatus.Paid:
      return 'Đã thanh toán'
    case OrderStatus.Pending:
      return 'Chờ xử lý'
    case OrderStatus.Processing:
      return 'Đang nấu'
    default:
      return 'Từ chối'
  }
}

export const getTableStatus = (status: (typeof TableStatus)[keyof typeof TableStatus]) => {
  switch (status) {
    case TableStatus.Available:
      return 'Available'
    case TableStatus.Reserved:
      return 'Reserved'
    default:
      return 'Hidden'
  }
}

export const getVietnameseTableStatus = (
  status: (typeof TableStatus)[keyof typeof TableStatus]
) => {
  switch (status) {
    case TableStatus.Available:
      return 'Có sẵn'
    case TableStatus.Reserved:
      return 'Đã đặt'
    default:
      return 'Ẩn'
  }
}

export const getTableLink = ({ token, tableNumber }: { token: string; tableNumber: number }) => {
  return envConfig.NEXT_PUBLIC_URL + `/${defaultLocale}/tables/` + tableNumber + '?token=' + token
}

export const decodeToken = (token: string) => {
  return jwtDecode(token) as TokenPayload
}

export function removeAccents(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

export const simpleMatchText = (fullText: string, matchText: string) => {
  return removeAccents(fullText.toLowerCase()).includes(
    removeAccents(matchText.trim().toLowerCase())
  )
}

export const formatDateTimeToLocaleString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), 'HH:mm:ss dd/MM/yyyy')
}

export function getImagePath(url: string): string {
  if (url.includes(envConfig.NEXT_PUBLIC_URL)) {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname
    } catch (e) {
      return url
    }
  }
  return url
}

export const formatDateTimeToTimeString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), 'HH:mm:ss')
}

export const generateSocketInstace = (accessToken: string) => {
  return io(envConfig.NEXT_PUBLIC_WS_ORIGIN, {
    auth: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export const OrderStatusIcon = {
  [OrderStatus.Pending]: Loader,
  [OrderStatus.Processing]: CookingPot,
  [OrderStatus.Rejected]: BookX,
  [OrderStatus.Delivered]: Truck,
  [OrderStatus.Paid]: HandCoins,
}

export const wrapServerApi = async <T>(fn: () => Promise<T>) => {
  let result = null
  try {
    result = await fn()
  } catch (error: any) {
    if (error.digest?.includes('NEXT_REDIRECT')) {
      throw error
    }
  }
  return result
}

export const generateSlugUrl = ({ name, id }: { name: string; id: number }) => {
  return `${slugify(name)}-i.${id}`
}

export const getIdFromSlugUrl = (slug: string) => {
  return Number(slug.split('-i.')[1])
}
