import prisma from '@/database'
import { Cron } from 'croner'

// Cron pattern for every hour

const autoRemoveRefreshTokenJob = (fastify: any) => {
  Cron('@hourly', async () => {
    try {
      await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
    } catch (error) {
      fastify.log.error({ err: error }, '[Auto Remove Refresh Token Job] Error:')
    }
  })
}

export default autoRemoveRefreshTokenJob
