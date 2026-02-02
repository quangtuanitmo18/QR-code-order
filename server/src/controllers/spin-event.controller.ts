import {
  CreateSpinEventBodyType,
  GetSpinEventsQueryParamsType,
  UpdateSpinEventBodyType
} from '@/schemaValidations/spin-event.schema'
import { spinEventService } from '@/services/spin-event.service'

export const getAllSpinEventsController = async (query: GetSpinEventsQueryParamsType) => {
  return await spinEventService.getAllEvents(query)
}

export const getActiveSpinEventsController = async () => {
  return await spinEventService.getActiveEvents()
}

export const getActiveSpinEventsForEmployeeController = async (employeeId: number) => {
  return await spinEventService.getActiveEventsForEmployee(employeeId)
}

export const getSpinEventByIdController = async (id: number) => {
  return await spinEventService.getEventById(id)
}

export const createSpinEventController = async (userId: number, body: CreateSpinEventBodyType) => {
  return await spinEventService.createEvent({
    name: body.name,
    description: body.description,
    startDate: body.startDate,
    endDate: body.endDate,
    isActive: body.isActive,
    createdById: userId,
    employeeIds: body.employeeIds
  })
}

export const updateSpinEventController = async (id: number, body: UpdateSpinEventBodyType) => {
  return await spinEventService.updateEvent(id, {
    name: body.name,
    description: body.description,
    startDate: body.startDate,
    endDate: body.endDate,
    isActive: body.isActive,
    employeeIds: body.employeeIds
  })
}

export const deleteSpinEventController = async (id: number) => {
  await spinEventService.deleteEvent(id)
  return { success: true }
}

export const toggleSpinEventActiveController = async (id: number) => {
  return await spinEventService.toggleActive(id)
}
