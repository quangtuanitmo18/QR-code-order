import envConfig from '@/config'
import http from '@/lib/http'
import {
  CreateTableBodyType,
  TableListResType,
  TableResType,
  UpdateTableBodyType,
} from '@/schemaValidations/table.schema'

const tableApiRequest = {
  // Client-side API calls (no cache)
  list: () => http.get<TableListResType>('tables'),

  // Server-side API calls (with cache and tags for revalidation)
  sGetList: () =>
    fetch(`${envConfig.NEXT_PUBLIC_API_ENDPOINT}/tables`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: {
        tags: ['tables'],
      },
    }).then((res) => res.json()) as Promise<TableListResType>,

  add: (body: CreateTableBodyType) => http.post<TableResType>('tables', body),
  getTable: (id: number) => http.get<TableResType>(`tables/${id}`),
  updateTable: (id: number, body: UpdateTableBodyType) =>
    http.put<TableResType>(`tables/${id}`, body),
  deleteTable: (id: number) => http.delete<TableResType>(`tables/${id}`),
}

export default tableApiRequest
