import envConfig from '@/config'
import axios from 'axios'
import { Cron } from 'croner'

import { FastifyInstance } from 'fastify'

const autoCheckHeartbeatJob = (fastify: FastifyInstance) => {
  // Only create the job if SENTRY_HEARTBEAT_URL is configured
  if (!envConfig.SENTRY_HEARTBEAT_URL) {
    fastify.log.info('Heartbeat monitoring disabled: No SENTRY_HEARTBEAT_URL provided')
    return
  }

  Cron('* * * * *', async () => {
    try {
      const response = await axios.post(envConfig.SENTRY_HEARTBEAT_URL)
    } catch (error) {
      fastify.log.error({ err: error }, 'Failed to send heartbeat to GlitchTip')
    }
  })
}

export default autoCheckHeartbeatJob
