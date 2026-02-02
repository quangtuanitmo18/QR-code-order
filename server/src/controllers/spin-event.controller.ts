import { spinEventService } from '@/services/spin-event.service'
import {
  CreateSpinEventBodyType,
  GetSpinEventsQueryParamsType,
  UpdateSpinEventBodyType
} from '@/schemaValidations/spin-event.schema'

export const getAllSpinEventsController = async (query: GetSpinEventsQueryParamsType) => {
  return await spinEventService.getAllEvents(query)
}

export const getActiveSpinEventsController = async () => {
  return await spinEventService.getActiveEvents()
}

export const getSpinEventByIdController = async (id: number) => {
  return await spinEventService.getEventById(id)
}

export const createSpinEventController = async (userId: number, body: CreateSpinEventBodyType) => {
  return await spinEventService.createEvent({
    ...body,
    createdById: userId
  })
}

export const updateSpinEventController = async (id: number, body: UpdateSpinEventBodyType) => {
  return await spinEventService.updateEvent(id, body)
}

export const deleteSpinEventController = async (id: number) => {
  await spinEventService.deleteEvent(id)
  return { success: true }
}

export const toggleSpinEventActiveController = async (id: number) => {
  return await spinEventService.toggleActive(id)
}
