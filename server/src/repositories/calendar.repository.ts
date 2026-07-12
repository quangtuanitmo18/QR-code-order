import prisma from '@/database'

export interface CalendarEventFilters {
  typeId?: number
  employeeId?: number
}

export interface CreateEventData {
  title: string
  description?: string | null
  typeId: number
  startDate: Date
  endDate: Date
  allDay: boolean
  location?: string | null
  color?: string | null
  isRecurring: boolean
  recurringRule?: string | null
  createdById: number
}

export interface UpdateEventData {
  title?: string
  description?: string | null
  typeId?: number
  startDate?: Date
  endDate?: Date
  allDay?: boolean
  location?: string | null
  color?: string | null
  isRecurring?: boolean
  recurringRule?: string | null
}

export const calendarRepository = {
  // Find events by date range with optional filters
  async findEventsByDateRange(startDate: Date, endDate: Date, filters?: CalendarEventFilters) {
    return await prisma.calendarEvent.findMany({
      where: {
        startDate: {
          lte: endDate
        },
        endDate: {
          gte: startDate
        },
        ...(filters?.typeId && { typeId: filters.typeId }),
        ...(filters?.employeeId && {
          assignments: {
            some: {
              employeeId: filters.employeeId
            }
          }
        })
      },
      include: {
        type: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    })
  },

  // Find single event by ID with relations
  async findEventById(id: number) {
    return await prisma.calendarEvent.findUniqueOrThrow({
      where: { id },
      include: {
        type: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })
  },

  // Create event
  async createEvent(data: CreateEventData) {
    return await prisma.calendarEvent.create({
      data,
      include: {
        type: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })
  },

  // Update event
  async updateEvent(id: number, data: UpdateEventData) {
    return await prisma.calendarEvent.update({
      where: { id },
      data,
      include: {
        type: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })
  },

  // Delete event (cascades to assignments and notifications)
  async deleteEvent(id: number) {
    return await prisma.calendarEvent.delete({
      where: { id }
    })
  },

  // Find events assigned to specific employee
  async findEventsByEmployee(employeeId: number, startDate: Date, endDate: Date) {
    return await prisma.calendarEvent.findMany({
      where: {
        assignments: {
          some: {
            employeeId
          }
        },
        startDate: {
          lte: endDate
        },
        endDate: {
          gte: startDate
        }
      },
      include: {
        type: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    })
  },

  // Find public events (events with NO assignments = visible to all)
  async findPublicEvents(startDate: Date, endDate: Date) {
    return await prisma.calendarEvent.findMany({
      where: {
        assignments: {
          none: {} // No assignments = public event
        },
        startDate: {
          lte: endDate
        },
        endDate: {
          gte: startDate
        }
      },
      include: {
        type: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    })
  },

  // Assign employees to event
  async assignEmployeesToEvent(eventId: number, employeeIds: number[]) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Use createMany with skipDuplicates to handle existing assignments
      await tx.calendarEventAssignment.createMany({
        data: employeeIds.map((employeeId) => ({
          eventId,
          employeeId
        })),
        skipDuplicates: true
      })

      // Return updated event with assignments
      return await tx.calendarEvent.findUniqueOrThrow({
        where: { id: eventId },
        include: {
          type: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignments: {
            include: {
              employee: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })
    })
  },

  // Remove employee from event
  async removeEmployeeFromEvent(eventId: number, employeeId: number) {
    return await prisma.$transaction(async (tx) => {
      await tx.calendarEventAssignment.deleteMany({
        where: {
          eventId,
          employeeId
        }
      })

      // Return updated event with assignments
      return await tx.calendarEvent.findUniqueOrThrow({
        where: { id: eventId },
        include: {
          type: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignments: {
            include: {
              employee: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })
    })
  },

  // Remove all assignments from event (makes event public)
  async removeAllAssignmentsFromEvent(eventId: number) {
    return await prisma.$transaction(async (tx) => {
      await tx.calendarEventAssignment.deleteMany({
        where: {
          eventId
        }
      })

      // Return updated event with assignments
      return await tx.calendarEvent.findUniqueOrThrow({
        where: { id: eventId },
        include: {
          type: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignments: {
            include: {
              employee: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })
    })
  },

  // Get event dates with counts (for calendar picker)
  // Note: This method counts base events only. Recurring event occurrences
  // are expanded in the service layer when querying events.
  async getEventDatesWithCounts(startDate: Date, endDate: Date) {
    // Get all events in range
    const events = await prisma.calendarEvent.findMany({
      where: {
        startDate: {
          lte: endDate
        },
        endDate: {
          gte: startDate
        }
      },
      select: {
        startDate: true,
        endDate: true,
        isRecurring: true,
        recurringRule: true
      }
    })

    // Count events per day
    // Note: For recurring events, only the base event date is counted here.
    // Full recurring expansion happens in service layer when fetching events.
    const dateCounts = new Map<string, number>()

    events.forEach((event) => {
      if (event.isRecurring && event.recurringRule) {
        // For recurring events, count only the base event start date
        // Service layer will expand occurrences when querying events
        const eventDate = new Date(event.startDate)
        const dateKey = eventDate.toISOString().split('T')[0]
        dateCounts.set(dateKey, (dateCounts.get(dateKey) || 0) + 1)
      } else {
        // For non-recurring events, count each day the event spans
        const start = new Date(event.startDate)
        const end = new Date(event.endDate)

        // Count each day from start to end (inclusive)
        const currentDate = new Date(start)
        while (currentDate <= end) {
          const dateKey = currentDate.toISOString().split('T')[0]
          dateCounts.set(dateKey, (dateCounts.get(dateKey) || 0) + 1)
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
    })

    // Convert to array format with Date objects
    return Array.from(dateCounts.entries()).map(([date, count]) => ({
      date: new Date(date), // Convert ISO string to Date
      count
    }))
  }
}
