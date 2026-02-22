import { AsyncLocalStorage } from 'async_hooks'
import { FastifyBaseLogger } from 'fastify'

/**
 * AsyncLocalStorage allows us to persist state across asynchronous function calls
 * without explicitly passing it. We use it here to store the Fastify request logger.
 */
export const loggerStorage = new AsyncLocalStorage<FastifyBaseLogger>()

/**
 * Convenience method to get the current context logger.
 * If called outside of a request context (e.g. system jobs like Cron), it will return null.
 * You should fall back to the global fastify.log if this returns null.
 */
export const getContextLogger = (): FastifyBaseLogger | undefined => {
  return loggerStorage.getStore()
}
