import prisma from '@/database'
import { Conversation } from '@prisma/client'

interface FindAllFilters {
  accountId: number // Required: get conversations for this user
  type?: 'direct' | 'group'
  search?: string // Search by conversation name or participant names
  page?: number
  limit?: number
  sortBy?: 'updatedAt' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

interface FindAllResult {
  conversations: Conversation[]
  total: number
}

export const chatRepository = {
  /**
   * Find all conversations for a user with filtering, search, pagination, and sorting
   */
  async findAll(filters: FindAllFilters): Promise<FindAllResult> {
    const where: any = {
      participants: {
        some: {
          accountId: filters.accountId
        }
      }
    }

    // Filter by type
    if (filters?.type) {
      where.type = filters.type
    }

    // Search by conversation name or participant names
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        {
          participants: {
            some: {
              account: {
                name: { contains: filters.search },
                id: { not: filters.accountId } // Exclude self from search
              }
            }
          }
        }
      ]
    }

    // Pagination
    const page = filters?.page ?? 1
    const limit = filters?.limit ?? 20
    const skip = (page - 1) * limit

    // Sorting (default: updatedAt desc - most recent first)
    const sortBy = filters?.sortBy ?? 'updatedAt'
    const sortOrder = filters?.sortOrder ?? 'desc'
    const orderBy: any = { [sortBy]: sortOrder }

    // Get total count
    const total = await prisma.conversation.count({ where })

    // Get conversations with relations
    const conversations = await prisma.conversation.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        participants: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true
              }
            }
          }
        },
        pinnedBy: {
          where: {
            accountId: filters.accountId
          },
          select: {
            id: true,
            pinnedAt: true
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          },
          where: {
            isDeleted: false
          }
        }
      }
    })

    // Optimize unread count calculation: batch all counts in a single query instead of N queries
    // Build a map of conversationId -> lastReadAt for efficient lookup
    const conversationLastReadMap = new Map<number, Date | null>()
    conversations.forEach((conversation) => {
      const participant = conversation.participants.find((p) => p.accountId === filters.accountId)
      conversationLastReadMap.set(conversation.id, participant?.lastReadAt || null)
    })

    // Get all potentially unread messages in a single query
    // Only fetch conversationId and createdAt to minimize data transfer
    const conversationIds = conversations.map((c) => c.id)

    // Find the oldest lastReadAt to optimize query (only fetch messages after the oldest read time)
    // Edge case: If all conversations have a lastReadAt (none are null), we can optimize
    // by only fetching messages created after the oldest lastReadAt timestamp.
    // If any conversation has null lastReadAt, we must fetch all messages and filter in memory.
    const oldestLastReadAt = Array.from(conversationLastReadMap.values())
      .filter((date): date is Date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime())[0]

    // Build query: fetch messages that could be unread
    // Optimization: If all conversations have lastReadAt, only fetch messages after the oldest one
    // Otherwise, fetch all messages (we'll filter in memory based on each conversation's lastReadAt)
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId: { in: conversationIds },
        isDeleted: false,
        senderId: { not: filters.accountId }, // Exclude own messages
        // Apply optimization only if all conversations have lastReadAt
        ...(oldestLastReadAt && conversationLastReadMap.size === conversations.length
          ? { createdAt: { gt: oldestLastReadAt } }
          : {})
      },
      select: {
        conversationId: true,
        createdAt: true
      }
      // No need to order or limit - we're just counting
    })

    // Count unread messages per conversation in memory
    // This is fast since we're only processing conversationId and createdAt
    const unreadCountsMap = new Map<number, number>()
    conversations.forEach((conversation) => {
      unreadCountsMap.set(conversation.id, 0)
    })

    unreadMessages.forEach((message) => {
      const lastReadAt = conversationLastReadMap.get(message.conversationId)
      // If lastReadAt is null, count all messages; otherwise only count messages after lastReadAt
      if (!lastReadAt || message.createdAt > lastReadAt) {
        const currentCount = unreadCountsMap.get(message.conversationId) || 0
        unreadCountsMap.set(message.conversationId, currentCount + 1)
      }
    })

    // Attach unread counts to conversations
    const conversationsWithUnread = conversations.map((conversation) => ({
      ...conversation,
      unreadCount: unreadCountsMap.get(conversation.id) || 0
    }))

    return { conversations: conversationsWithUnread, total }
  },

  /**
   * Find conversation by ID with relations
   * Only returns if user is a participant
   */
  async findById(id: number, accountId: number) {
    return await prisma.conversation.findFirst({
      where: {
        id,
        participants: {
          some: {
            accountId
          }
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        participants: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true
              }
            }
          }
        },
        pinnedBy: {
          where: {
            accountId
          },
          select: {
            id: true,
            pinnedAt: true
          }
        }
      }
    })
  },

  /**
   * Find direct conversation between two users
   */
  async findDirectConversation(user1Id: number, user2Id: number) {
    // Find conversations where both users are participants
    const conversations = await prisma.conversation.findMany({
      where: {
        type: 'direct',
        participants: {
          some: {
            accountId: user1Id
          }
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        participants: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true
              }
            }
          }
        }
      }
    })

    // Filter to find conversation with exactly 2 participants (both users)
    const directConversation = conversations.find((conv) => {
      const participantIds = conv.participants.map((p) => p.account.id)
      return participantIds.length === 2 && participantIds.includes(user1Id) && participantIds.includes(user2Id)
    })

    return directConversation || null
  },

  /**
   * Create new conversation
   */
  async create(data: {
    type: 'direct' | 'group'
    name?: string | null
    avatar?: string | null
    createdById: number
    participantIds: number[] // Must include creator
  }): Promise<Conversation> {
    // Use transaction to create conversation and participants atomically
    return await prisma.$transaction(async (tx) => {
      // Create conversation
      const conversation = await tx.conversation.create({
        data: {
          type: data.type,
          name: data.name ?? null,
          avatar: data.avatar ?? null,
          createdById: data.createdById
        }
      })

      // Add participants (ensure creator is included)
      const uniqueParticipantIds = Array.from(new Set([data.createdById, ...data.participantIds]))
      await tx.conversationParticipant.createMany({
        data: uniqueParticipantIds.map((accountId) => ({
          conversationId: conversation.id,
          accountId
        }))
      })

      // Return conversation with relations
      return await tx.conversation.findUniqueOrThrow({
        where: { id: conversation.id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          participants: {
            include: {
              account: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                  role: true
                }
              }
            }
          }
        }
      })
    })
  },

  /**
   * Update conversation (name, avatar for group chats)
   */
  async update(
    id: number,
    data: {
      name?: string | null
      avatar?: string | null
    }
  ): Promise<Conversation> {
    const updateData: any = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.avatar !== undefined) updateData.avatar = data.avatar

    return await prisma.conversation.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        participants: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true
              }
            }
          }
        }
      }
    })
  },

  /**
   * Delete conversation (cascade deletes participants, messages, etc.)
   */
  async delete(id: number): Promise<boolean> {
    const conversation = await prisma.conversation.findUnique({
      where: { id }
    })

    if (!conversation) {
      return false
    }

    await prisma.conversation.delete({
      where: { id }
    })

    return true
  },

  /**
   * Add participants to conversation
   */
  async addParticipants(conversationId: number, participantIds: number[]) {
    // Check current participant count
    const currentCount = await prisma.conversationParticipant.count({
      where: { conversationId }
    })

    // Check if adding would exceed 50 participants limit
    if (currentCount + participantIds.length > 50) {
      throw new Error('Group chat cannot exceed 50 participants')
    }

    // Filter out existing participants
    const existing = await prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        accountId: { in: participantIds }
      },
      select: { accountId: true }
    })

    const existingIds = existing.map((p) => p.accountId)
    const newParticipantIds = participantIds.filter((id) => !existingIds.includes(id))

    if (newParticipantIds.length === 0) {
      return []
    }

    // Add new participants
    await prisma.conversationParticipant.createMany({
      data: newParticipantIds.map((accountId) => ({
        conversationId,
        accountId
      })),
      skipDuplicates: true
    })

    // Return updated participants list
    return await prisma.conversationParticipant.findMany({
      where: { conversationId },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        }
      }
    })
  },

  /**
   * Remove participant from conversation
   */
  async removeParticipant(conversationId: number, accountId: number): Promise<boolean> {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_accountId: {
          conversationId,
          accountId
        }
      }
    })

    if (!participant) {
      return false
    }

    await prisma.conversationParticipant.delete({
      where: {
        conversationId_accountId: {
          conversationId,
          accountId
        }
      }
    })

    return true
  },

  /**
   * Pin conversation for user
   */
  async pinConversation(conversationId: number, accountId: number) {
    return await prisma.conversationPin.upsert({
      where: {
        conversationId_accountId: {
          conversationId,
          accountId
        }
      },
      create: {
        conversationId,
        accountId
      },
      update: {
        pinnedAt: new Date()
      }
    })
  },

  /**
   * Unpin conversation for user
   */
  async unpinConversation(conversationId: number, accountId: number): Promise<boolean> {
    const pin = await prisma.conversationPin.findUnique({
      where: {
        conversationId_accountId: {
          conversationId,
          accountId
        }
      }
    })

    if (!pin) {
      return false
    }

    await prisma.conversationPin.delete({
      where: {
        conversationId_accountId: {
          conversationId,
          accountId
        }
      }
    })

    return true
  },

  /**
   * Mute conversation for user
   */
  async muteConversation(conversationId: number, accountId: number) {
    return await prisma.conversationParticipant.update({
      where: {
        conversationId_accountId: {
          conversationId,
          accountId
        }
      },
      data: {
        isMuted: true
      }
    })
  },

  /**
   * Unmute conversation for user
   */
  async unmuteConversation(conversationId: number, accountId: number) {
    return await prisma.conversationParticipant.update({
      where: {
        conversationId_accountId: {
          conversationId,
          accountId
        }
      },
      data: {
        isMuted: false
      }
    })
  },

  /**
   * Update conversation updatedAt timestamp (when new message is sent)
   */
  async updateTimestamp(conversationId: number) {
    return await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date()
      }
    })
  }
}
