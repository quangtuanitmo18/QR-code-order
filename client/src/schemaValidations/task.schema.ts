import { z } from 'zod'

// Task Schema (for responses - dates as ISO strings)
export const TaskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  category: z.string(),
  priority: z.string(),
  dueDate: z.string().nullable(), // ISO date string
  assignedToId: z.number().nullable(),
  createdById: z.number(),
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
  assignedTo: z
    .object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
    })
    .optional()
    .nullable(),
  createdBy: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }),
})

export type TaskType = z.TypeOf<typeof TaskSchema>

// Get Tasks Query Parameters
export const GetTasksQueryParams = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  assignedToId: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title', 'priority', 'status', 'dueDate'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type GetTasksQueryParamsType = z.TypeOf<typeof GetTasksQueryParams>

// Get Statistics Query Parameters (no pagination/sorting)
export const GetStatisticsQueryParams = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  assignedToId: z.coerce.number().optional(),
  search: z.string().optional(),
})

export type GetStatisticsQueryParamsType = z.TypeOf<typeof GetStatisticsQueryParams>

// Get Statistics Response
export const GetStatisticsRes = z.object({
  data: z.object({
    total: z.number(),
    completed: z.number(),
    inProgress: z.number(),
    pending: z.number(),
  }),
  message: z.string(),
})

export type GetStatisticsResType = z.TypeOf<typeof GetStatisticsRes>

// Get Tasks Response
export const GetTasksRes = z.object({
  data: z.object({
    tasks: z.array(TaskSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
    statistics: z.object({
      total: z.number(),
      completed: z.number(),
      inProgress: z.number(),
      pending: z.number(),
    }),
  }),
  message: z.string(),
})

export type GetTasksResType = z.TypeOf<typeof GetTasksRes>

// Get Task by ID Response
export const GetTaskRes = z.object({
  data: TaskSchema.extend({
    comments: z
      .array(
        z.object({
          id: z.number(),
          content: z.string(),
          createdById: z.number(),
          createdAt: z.string(), // ISO date string
          updatedAt: z.string(), // ISO date string
          createdBy: z.object({
            id: z.number(),
            name: z.string(),
            email: z.string(),
          }),
        })
      )
      .optional(),
    attachments: z
      .array(
        z.object({
          id: z.number(),
          fileName: z.string(),
          filePath: z.string(),
          fileSize: z.number(),
          mimeType: z.string(),
          uploadedById: z.number(),
          createdAt: z.string(), // ISO date string
          uploadedBy: z.object({
            id: z.number(),
            name: z.string(),
            email: z.string(),
          }),
          fileUrl: z.string(),
        })
      )
      .optional(),
  }),
  message: z.string(),
})

export type GetTaskResType = z.TypeOf<typeof GetTaskRes>

// Create Task Body
export const CreateTaskBody = z
  .object({
    title: z.string().min(1).max(255),
    description: z.string().max(5000).optional().nullable(),
    status: z.enum(['todo', 'in_progress', 'completed', 'pending']).optional().default('todo'),
    category: z.enum(['Feature', 'Bug', 'Docs', 'Improvement', 'Refactor']),
    priority: z.enum(['Critical', 'Important', 'Normal', 'Minor']).optional().default('normal'),
    dueDate: z.coerce.date().optional().nullable(),
    assignedToId: z.coerce.number().optional().nullable(),
  })
  .strict()

export type CreateTaskBodyType = z.TypeOf<typeof CreateTaskBody>

// Create Task Response
export const CreateTaskRes = z.object({
  data: TaskSchema,
  message: z.string(),
})

export type CreateTaskResType = z.TypeOf<typeof CreateTaskRes>

// Update Task Body
export const UpdateTaskBody = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).optional().nullable(),
    status: z.enum(['todo', 'in_progress', 'completed', 'pending']).optional(),
    category: z.enum(['Feature', 'Bug', 'Docs', 'Improvement', 'Refactor']).optional(),
    priority: z.enum(['Critical', 'Important', 'Normal', 'Minor']).optional(),
    dueDate: z.coerce.date().optional().nullable(),
    assignedToId: z.coerce.number().optional().nullable(),
  })
  .strict()

export type UpdateTaskBodyType = z.TypeOf<typeof UpdateTaskBody>

// Update Task Response
export const UpdateTaskRes = z.object({
  data: TaskSchema,
  message: z.string(),
})

export type UpdateTaskResType = z.TypeOf<typeof UpdateTaskRes>

// Delete Task Response
export const DeleteTaskRes = z.object({
  message: z.string(),
})

export type DeleteTaskResType = z.TypeOf<typeof DeleteTaskRes>

// Task ID Param
export const TaskIdParam = z.object({
  id: z.coerce.number(),
})

export type TaskIdParamType = z.TypeOf<typeof TaskIdParam>
