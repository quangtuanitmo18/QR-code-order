import { createTable, deleteTable, getTableDetail, getTableList, updateTable } from '@/controllers/table.controller'
import { pauseApiHook, requireEmployeeHook, requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import {
  CreateTableBody,
  CreateTableBodyType,
  TableListRes,
  TableListResType,
  TableParams,
  TableParamsType,
  TableRes,
  TableResType,
  UpdateTableBody,
  UpdateTableBodyType
} from '@/schemaValidations/table.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function tablesRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get<{
    Reply: TableListResType
  }>(
    '/',
    {
      schema: {
        response: {
          200: TableListRes
        }
      }
    },
    async (request, reply) => {
      const Tables = await getTableList()
      reply.send({
        data: Tables as TableListResType['data'],
        message: 'Lấy danh sách bàn thành công!'
      })
    }
  )

  fastify.get<{
    Params: TableParamsType
    Reply: TableResType
  }>(
    '/:number',
    {
      schema: {
        params: TableParams,
        response: {
          200: TableRes
        }
      }
    },
    async (request, reply) => {
      const Table = await getTableDetail(request.params.number)
      reply.send({
        data: Table as TableResType['data'],
        message: 'Lấy thông tin bàn thành công!'
      })
    }
  )

  fastify.post<{
    Body: CreateTableBodyType
    Reply: TableResType
  }>(
    '',
    {
      schema: {
        body: CreateTableBody,
        response: {
          200: TableRes
        }
      },
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: 'and'
      })
    },
    async (request, reply) => {
      const Table = await createTable(request.body)
      reply.send({
        data: Table as TableResType['data'],
        message: 'Tạo bàn thành công!'
      })
    }
  )

  fastify.put<{
    Params: TableParamsType
    Body: UpdateTableBodyType
    Reply: TableResType
  }>(
    '/:number',
    {
      schema: {
        params: TableParams,
        body: UpdateTableBody,
        response: {
          200: TableRes
        }
      },
      preValidation: fastify.auth([pauseApiHook, requireLoginedHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: 'and'
      })
    },
    async (request, reply) => {
      const Table = await updateTable(request.params.number, request.body)
      reply.send({
        data: Table as TableResType['data'],
        message: 'Cập nhật bàn thành công!'
      })
    }
  )

  fastify.delete<{
    Params: TableParamsType
    Reply: TableResType
  }>(
    '/:number',
    {
      schema: {
        params: TableParams,
        response: {
          200: TableRes
        }
      },
      preValidation: fastify.auth([pauseApiHook, requireLoginedHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: 'and'
      })
    },
    async (request, reply) => {
      const result = await deleteTable(request.params.number)
      reply.send({
        message: 'Xóa bàn thành công!',
        data: result as TableResType['data']
      })
    }
  )
}
