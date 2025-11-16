import revalidateApiRequest from '@/apiRequests/revalidate'

/**
 * Retry revalidation with exponential backoff
 * @param tag - The cache tag to revalidate
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns Promise that resolves when revalidation succeeds or all retries are exhausted
 */
export async function revalidateWithRetry(tag: string, maxRetries: number = 3): Promise<void> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await revalidateApiRequest(tag)
      // Success - return early
      return
    } catch (error) {
      lastError = error as Error

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }

      // Calculate delay with exponential backoff: 2^attempt * 1000ms
      // Attempt 0: 1s, Attempt 1: 2s, Attempt 2: 4s
      const delay = Math.pow(2, attempt) * 1000

      console.warn(
        `Revalidation attempt ${attempt + 1}/${maxRetries + 1} failed for tag "${tag}". Retrying in ${delay}ms...`,
        error
      )

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // All retries exhausted - log error but don't throw
  console.error(`Revalidation failed after ${maxRetries + 1} attempts for tag "${tag}":`, lastError)
}
