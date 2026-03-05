import prisma from '@/database'

export const dishCategoryRepository = {
  async findAll() {
    return await prisma.dishCategory.findMany({
      orderBy: { name: 'asc' }
    })
  },

  async findById(id: number) {
    return await prisma.dishCategory.findUnique({ where: { id } })
  },

  async findByName(name: string) {
    return await prisma.dishCategory.findUnique({ where: { name } })
  },

  async create(data: { name: string; description?: string | null }) {
    return await prisma.dishCategory.create({ data })
  },

  async update(id: number, data: { name?: string; description?: string | null }) {
    return await prisma.dishCategory.update({ where: { id }, data })
  },

  async delete(id: number) {
    await prisma.dishCategory.delete({ where: { id } })
    return true
  }
}
