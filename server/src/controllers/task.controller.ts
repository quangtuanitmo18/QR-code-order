import { CreateTaskBodyType, GetTasksQueryParamsType, UpdateTaskBodyType } from '@/schemaValidations/task.schema'
import { taskService } from '@/services/task.service'

export const getTasksController = async (query: GetTasksQueryParamsType) => {
  return await taskService.getTasks(query)
}

export const getStatisticsController = async () => {
  return await taskService.getTaskStatistics()
}

export const getTaskByIdController = async (id: number) => {
  return await taskService.getTaskById(id)
}

export const createTaskController = async (userId: number, body: CreateTaskBodyType) => {
  return await taskService.createTask({
    title: body.title,
    description: body.description,
    status: body.status,
    category: body.category,
    priority: body.priority,
    dueDate: body.dueDate,
    assignedToId: body.assignedToId,
    createdById: userId
  })
}

export const updateTaskController = async (id: number, body: UpdateTaskBodyType) => {
  return await taskService.updateTask(id, {
    title: body.title,
    description: body.description,
    status: body.status,
    category: body.category,
    priority: body.priority,
    dueDate: body.dueDate,
    assignedToId: body.assignedToId
  })
}

export const deleteTaskController = async (id: number) => {
  return await taskService.deleteTask(id)
}
