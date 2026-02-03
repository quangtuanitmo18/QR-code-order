import http from '@/lib/http'
import {
  CreateTaskBodyType,
  CreateTaskResType,
  DeleteTaskResType,
  GetTaskResType,
  GetTasksQueryParamsType,
  GetTasksResType,
  UpdateTaskBodyType,
  UpdateTaskResType,
} from '@/schemaValidations/task.schema'

export const taskApiRequest = {
  getTasks: (queryParams?: GetTasksQueryParamsType) =>
    http.get<GetTasksResType>('/tasks', {
      params: queryParams,
    }),

  getTaskById: (id: number) => http.get<GetTaskResType>(`/tasks/${id}`),

  createTask: (body: CreateTaskBodyType) => http.post<CreateTaskResType>('/tasks', body),

  updateTask: (id: number, body: UpdateTaskBodyType) =>
    http.put<UpdateTaskResType>(`/tasks/${id}`, body),

  deleteTask: (id: number) => http.delete<DeleteTaskResType>(`/tasks/${id}`),
}

export default taskApiRequest
