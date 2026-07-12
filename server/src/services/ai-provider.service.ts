import envConfig from '@/config'
import { generateObject, generateText, streamText } from 'ai'

let googleProvider: any = null

const googleImportPromise = import('@ai-sdk/google')
  .then((mod) => {
    googleProvider = mod.createGoogleGenerativeAI({
      apiKey: envConfig.GOOGLE_GENERATIVE_AI_API_KEY
    })
  })
  .catch((err) => {
    console.error('Failed to load @ai-sdk/google provider:', err)
  })

const DEFAULT_MODEL = 'gemini-3.1-flash-lite'

async function getGoogleModel(modelName: string) {
  if (!googleProvider) {
    await googleImportPromise
  }
  if (!googleProvider) {
    throw new Error('Google Generative AI provider is not loaded.')
  }
  return googleProvider(modelName)
}

export async function generateObjectWithFallback(
  options: any,
  _primaryModelStr?: string,
  fallbackModelStr = DEFAULT_MODEL
) {
  const model = await getGoogleModel(fallbackModelStr)
  return await generateObject({ ...options, model })
}

export async function generateTextWithFallback(
  options: any,
  _primaryModelStr?: string,
  fallbackModelStr = DEFAULT_MODEL
) {
  const model = await getGoogleModel(fallbackModelStr)
  return await generateText({ ...options, model })
}

export async function streamTextWithFallback(
  options: any,
  _primaryModelStr?: string,
  fallbackModelStr = DEFAULT_MODEL
) {
  const model = await getGoogleModel(fallbackModelStr)
  return streamText({ ...options, model })
}
