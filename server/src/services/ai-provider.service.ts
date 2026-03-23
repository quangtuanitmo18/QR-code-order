import envConfig from '@/config'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateObject, generateText, streamText } from 'ai'

export const openrouter = createOpenRouter({
  apiKey: envConfig.OPENROUTER_API_KEY
})

const DEFAULT_MODEL = 'google/gemini-2.5-flash'

export async function generateObjectWithFallback(
  options: any,
  _primaryModelStr?: string,
  fallbackModelStr = DEFAULT_MODEL
) {
  return await generateObject({ ...options, model: openrouter.chat(fallbackModelStr) })
}

export async function generateTextWithFallback(
  options: any,
  _primaryModelStr?: string,
  fallbackModelStr = DEFAULT_MODEL
) {
  return await generateText({ ...options, model: openrouter.chat(fallbackModelStr) })
}

export function streamTextWithFallback(options: any, _primaryModelStr?: string, fallbackModelStr = DEFAULT_MODEL) {
  return streamText({ ...options, model: openrouter.chat(fallbackModelStr) })
}
