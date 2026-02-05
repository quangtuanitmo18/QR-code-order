import prisma from '@/database'
import { Message } from '@prisma/client'

interface FindAllFilters {
  conversationId: number
  accountId: number // Required: to filter out deleted messages for other users
  before?: Date // Cursor-based pagination: get messages before this date
  limit?: number
  search?: string // Search in message content
}

interface FindAllResult {
  messages: Message[]
  hasMore: boolean
  nextCursor?: Date
}

interface SearchFilters {
  accountId: number // Search in user's conversations only
  query: string
  conversationId?: number // Optional: limit to specific conversation
  page?: number
  limit?: number
}

interface SearchResult {
  messages: Message[]
  total: number
}

export const messageRepository = {
  /**
   * Find messages for a conversation with cursor-based pagination
   * Returns messages in descending order (newest first)
   */
  async findAll(filters: FindAllFilters): Promise<FindAllResult> {
    const where: any = {
      conversationId: filters.conversationId,
      // Show deleted messages only to sender, hide from others
      OR: [
        { isDeleted: false },
        {
          isDeleted: true,
          senderId: filters.accountId // Sender can see their deleted messages
        }
      ]
    }

    // Cursor-based pagination: get messages before this date
    if (filters.before) {
      where.createdAt = {
        lt: filters.before
      }
    }

    const limit = filters.limit ?? 50

    // Get one extra to check if there are more
    const messages = await prisma.message.findMany({
      where,
      take: limit + 1,
      orderBy: {
        createdAt: 'desc' // Newest first
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        attachments: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        reactions: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        readReceipts: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    // Check if there are more messages
    const hasMore = messages.length > limit
    const resultMessages = hasMore ? messages.slice(0, limit) : messages

    // Get next cursor (oldest message's createdAt)
    const nextCursor = resultMessages.length > 0 ? resultMessages[resultMessages.length - 1].createdAt : undefined

    return {
      messages: resultMessages.reverse(), // Reverse to show oldest first (for chat UI)
      hasMore,
      nextCursor
    }
  },

  /**
   * Find message by ID
   */
  async findById(id: number, accountId: number) {
    return await prisma.message.findFirst({
      where: {
        id,
        // Show deleted messages only to sender
        OR: [
          { isDeleted: false },
          {
            isDeleted: true,
            senderId: accountId
          }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        attachments: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        reactions: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        readReceipts: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    })
  },

  /**
   * Create new message
   */
  async create(data: {
    conversationId: number
    senderId: number
    content: string
    type?: string
    replyToId?: number | null
  }): Promise<Message> {
    return await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        type: data.type ?? 'text',
        replyToId: data.replyToId ?? null
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        attachments: true,
        reactions: true,
        readReceipts: true
      }
    })
  },

  /**
   * Update message (edit)
   */
  async update(id: number, data: { content: string }): Promise<Message> {
    return await prisma.message.update({
      where: { id },
      data: {
        content: data.content,
        isEdited: true
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        attachments: true,
        reactions: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        readReceipts: true
      }
    })
  },

  /**
   * Soft delete message
   */
  async delete(id: number): Promise<boolean> {
    const message = await prisma.message.findUnique({
      where: { id }
    })

    if (!message) {
      return false
    }

    // Soft delete: set isDeleted flag
    await prisma.message.update({
      where: { id },
      data: {
        isDeleted: true
      }
    })

    return true
  },

  /**
   * Search messages across user's conversations
   */
  async search(filters: SearchFilters): Promise<SearchResult> {
    const where: any = {
      // Only search in conversations where user is a participant
      conversation: {
        participants: {
          some: {
            accountId: filters.accountId
          }
        }
      },
      // Search in message content
      content: {
        contains: filters.query
      },
      // Don't show deleted messages (except to sender, but for search we'll hide all deleted)
      isDeleted: false
    }

    // Optional: limit to specific conversation
    if (filters.conversationId) {
      where.conversationId = filters.conversationId
    }

    // Pagination
    const page = filters?.page ?? 1
    const limit = filters?.limit ?? 20
    const skip = (page - 1) * limit

    // Get total count
    const total = await prisma.message.count({ where })

    // Get messages
    const messages = await prisma.message.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc' // Most recent matches first
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        conversation: {
          select: {
            id: true,
            type: true,
            name: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    return { messages, total }
  },

  /**
   * Mark message as read
   */
  async markAsRead(messageId: number, accountId: number) {
    return await prisma.messageReadReceipt.upsert({
      where: {
        messageId_accountId: {
          messageId,
          accountId
        }
      },
      create: {
        messageId,
        accountId,
        readAt: new Date()
      },
      update: {
        readAt: new Date()
      }
    })
  },

  /**
   * Update participant's lastReadAt for a conversation
   */
  async updateLastReadAt(conversationId: number, accountId: number) {
    return await prisma.conversationParticipant.update({
      where: {
        conversationId_accountId: {
          conversationId,
          accountId
        }
      },
      data: {
        lastReadAt: new Date()
      }
    })
  },

  /**
   * Add reaction to message
   */
  async addReaction(messageId: number, accountId: number, emoji: string) {
    return await prisma.messageReaction.upsert({
      where: {
        messageId_accountId_emoji: {
          messageId,
          accountId,
          emoji
        }
      },
      create: {
        messageId,
        accountId,
        emoji
      },
      update: {
        // If already exists, just return it
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })
  },

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId: number, accountId: number, emoji: string): Promise<boolean> {
    const reaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_accountId_emoji: {
          messageId,
          accountId,
          emoji
        }
      }
    })

    if (!reaction) {
      return false
    }

    await prisma.messageReaction.delete({
      where: {
        messageId_accountId_emoji: {
          messageId,
          accountId,
          emoji
        }
      }
    })

    return true
  }
}
