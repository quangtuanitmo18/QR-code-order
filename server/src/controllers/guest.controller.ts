import { GuestCreateOrdersBodyType, GuestLoginBodyType } from '@/schemaValidations/guest.schema'
import { guestService } from '@/services/guest.service'

export const guestLoginController = async (body: GuestLoginBodyType) => {
  return await guestService.login(body)
}

export const guestLogoutController = async (id: number) => {
  return await guestService.logout(id)
}

export const guestRefreshTokenController = async (refreshToken: string) => {
  return await guestService.refreshToken(refreshToken)
}

export const guestCreateOrdersController = async (guestId: number, body: GuestCreateOrdersBodyType) => {
  return await guestService.createOrders(guestId, body)
}

export const guestGetOrdersController = async (guestId: number) => {
  return await guestService.getOrders(guestId)
}
