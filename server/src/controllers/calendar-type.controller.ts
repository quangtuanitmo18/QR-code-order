import { calendarTypeService } from '@/services/calendar-type.service'
import {
  CreateCalendarTypeBodyType,
  UpdateCalendarTypeBodyType,
  GetCalendarTypesQueryParamsType
} from '@/schemaValidations/calendar-type.schema'

export const getCalendarTypesController = async (query: GetCalendarTypesQueryParamsType) => {
  return await calendarTypeService.getCalendarTypes({
    visible: query.visible,
    category: query.category
  })
}

export const getCalendarTypeByIdController = async (id: number) => {
  return await calendarTypeService.getCalendarTypeById(id)
}

export const createCalendarTypeController = async (userId: number, body: CreateCalendarTypeBodyType) => {
  return await calendarTypeService.createCalendarType({
    name: body.name,
    label: body.label,
    color: body.color,
    category: body.category,
    visible: body.visible,
    createdById: userId
  })
}

export const updateCalendarTypeController = async (id: number, body: UpdateCalendarTypeBodyType) => {
  return await calendarTypeService.updateCalendarType(id, {
    label: body.label,
    color: body.color,
    category: body.category,
    visible: body.visible
  })
}

export const deleteCalendarTypeController = async (id: number) => {
  return await calendarTypeService.deleteCalendarType(id)
}

export const toggleVisibilityController = async (id: number) => {
  return await calendarTypeService.toggleVisibility(id)
}
