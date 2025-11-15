import {
  ChangePasswordBodyType,
  CreateEmployeeAccountBodyType,
  CreateGuestBodyType,
  UpdateEmployeeAccountBodyType,
  UpdateMeBodyType
} from '@/schemaValidations/account.schema'
import { accountService } from '@/services/account.service'

export const initOwnerAccount = async () => {
  return await accountService.initOwnerAccount()
}

export const createEmployeeAccount = async (body: CreateEmployeeAccountBodyType) => {
  return await accountService.createEmployee(body)
}

export const getEmployeeAccounts = async () => {
  return await accountService.getEmployees()
}

export const getEmployeeAccount = async (accountId: number) => {
  return await accountService.getAccountById(accountId)
}

export const getAccountList = async () => {
  return await accountService.getAllAccounts()
}

export const updateEmployeeAccount = async (accountId: number, body: UpdateEmployeeAccountBodyType) => {
  return await accountService.updateEmployee(accountId, body)
}

export const deleteEmployeeAccount = async (accountId: number) => {
  return await accountService.deleteEmployee(accountId)
}

export const getMeController = async (accountId: number) => {
  return await accountService.getMe(accountId)
}

export const updateMeController = async (accountId: number, body: UpdateMeBodyType) => {
  return await accountService.updateMe(accountId, body)
}

export const changePasswordController = async (accountId: number, body: ChangePasswordBodyType) => {
  return await accountService.changePassword(accountId, body)
}

export const changePasswordV2Controller = async (accountId: number, body: ChangePasswordBodyType) => {
  return await accountService.changePasswordV2(accountId, body)
}

export const getGuestList = async ({ fromDate, toDate }: { fromDate?: Date; toDate?: Date }) => {
  return await accountService.getGuests({ fromDate, toDate })
}

export const createGuestController = async (body: CreateGuestBodyType) => {
  return await accountService.createGuest(body)
}
