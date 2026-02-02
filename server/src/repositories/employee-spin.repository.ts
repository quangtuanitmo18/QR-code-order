import prisma from '@/database'
import { Prisma } from '@prisma/client'

export interface EmployeeSpinFilters {
  status?: string
  fromDate?: Date
  toDate?: Date
}

export interface CreateEmployeeSpinData {
  employeeId: number
  rewardId: number
  status?: string
  expiredAt?: Date | null
  notes?: string | null
  createdById?: number | null
}

export interface UpdateEmployeeSpinData {
  status?: string
  claimedAt?: Date | null
  expiredAt?: Date | null
  notes?: string | null
}

export interface AdminSpinFilters extends EmployeeSpinFilters {
  employeeId?: number
}

export const employeeSpinRepository = {
  // Create employee spin
  async create(data: CreateEmployeeSpinData) {
    return await prisma.employeeSpin.create({
      data: {
        employeeId: data.employeeId,
        rewardId: data.rewardId,
        status: data.status ?? 'PENDING',
        expiredAt: data.expiredAt ?? null,
        notes: data.notes ?? null,
        createdById: data.createdById ?? null
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        reward: {
          select: {
            id: true,
            name: true,
            type: true,
            value: true,
            color: true,
            icon: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  },

  // Find spin by ID
  async findById(id: number) {
    return await prisma.employeeSpin.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        reward: {
          select: {
            id: true,
            name: true,
            type: true,
            value: true,
            color: true,
            icon: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  },

  // Find spin by ID with lock (for transaction)
  async findByIdWithLock(id: number) {
    // SQLite doesn't support SELECT FOR UPDATE, but we can use findUnique
    // The transaction isolation will handle the locking
    return await prisma.employeeSpin.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        reward: {
          select: {
            id: true,
            name: true,
            type: true,
            value: true,
            color: true,
            icon: true
          }
        }
      }
    })
  },

  // Find spins by employee ID with filters
  async findByEmployeeId(employeeId: number, filters?: EmployeeSpinFilters) {
    const where: Prisma.EmployeeSpinWhereInput = {
      employeeId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.fromDate || filters?.toDate) {
      where.spinDate = {}
      if (filters.fromDate) {
        where.spinDate.gte = filters.fromDate
      }
      if (filters.toDate) {
        where.spinDate.lte = filters.toDate
      }
    }

    return await prisma.employeeSpin.findMany({
      where,
      include: {
        reward: {
          select: {
            id: true,
            name: true,
            type: true,
            value: true,
            color: true,
            icon: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { spinDate: 'desc' }
    })
  },

  // Find pending spins by employee ID (not expired)
  async findPendingByEmployeeId(employeeId: number) {
    const now = new Date()
    return await prisma.employeeSpin.findMany({
      where: {
        employeeId,
        status: 'PENDING',
        OR: [{ expiredAt: null }, { expiredAt: { gt: now } }]
      },
      include: {
        reward: {
          select: {
            id: true,
            name: true,
            type: true,
            value: true,
            color: true,
            icon: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { spinDate: 'desc' }
    })
  },

  // Find all spins (admin) with filters and pagination
  async findAll(filters?: AdminSpinFilters, pagination?: { page: number; limit: number }) {
    const where: Prisma.EmployeeSpinWhereInput = {}

    if (filters?.employeeId) {
      where.employeeId = filters.employeeId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.fromDate || filters?.toDate) {
      where.spinDate = {}
      if (filters.fromDate) {
        where.spinDate.gte = filters.fromDate
      }
      if (filters.toDate) {
        where.spinDate.lte = filters.toDate
      }
    }

    const skip = pagination ? (pagination.page - 1) * pagination.limit : undefined
    const take = pagination?.limit

    const [spins, total] = await Promise.all([
      prisma.employeeSpin.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          reward: {
            select: {
              id: true,
              name: true,
              type: true,
              value: true,
              color: true,
              icon: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { spinDate: 'desc' },
        skip,
        take
      }),
      prisma.employeeSpin.count({ where })
    ])

    return {
      spins,
      pagination: pagination
        ? {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages: Math.ceil(total / pagination.limit)
          }
        : undefined
    }
  },

  // Update employee spin
  async update(id: number, data: UpdateEmployeeSpinData) {
    return await prisma.employeeSpin.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.claimedAt !== undefined && { claimedAt: data.claimedAt }),
        ...(data.expiredAt !== undefined && { expiredAt: data.expiredAt }),
        ...(data.notes !== undefined && { notes: data.notes })
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        reward: {
          select: {
            id: true,
            name: true,
            type: true,
            value: true,
            color: true,
            icon: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  }
}
