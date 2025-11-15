import { CreateTableBodyType, UpdateTableBodyType } from '@/schemaValidations/table.schema'
import { tableService } from '@/services/table.service'

export const getTableList = () => {
  return tableService.getTableList()
}

export const getTableDetail = (number: number) => {
  return tableService.getTableDetail(number)
}

export const createTable = async (data: CreateTableBodyType) => {
  return await tableService.createTable(data)
}

export const updateTable = (number: number, data: UpdateTableBodyType) => {
  return tableService.updateTable(number, data)
}

export const deleteTable = (number: number) => {
  return tableService.deleteTable(number)
}
