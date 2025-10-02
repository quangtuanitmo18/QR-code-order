import envConfig from '@/config'
import axios from 'axios'
import { Cron } from 'croner'

const autoCheckHeartbeatJob = () => {
  // Only create the job if SENTRY_HEARTBEAT_URL is configured
  if (!envConfig.SENTRY_HEARTBEAT_URL) {
    console.log('Heartbeat monitoring disabled: No SENTRY_HEARTBEAT_URL provided')
    return
  }

  Cron('@minutely', async () => {
    try {
      const response = await axios.post(envConfig.SENTRY_HEARTBEAT_URL)
    } catch (error) {
      console.error('Failed to send heartbeat to GlitchTip:', error)
    }
  })
}

export default autoCheckHeartbeatJob
