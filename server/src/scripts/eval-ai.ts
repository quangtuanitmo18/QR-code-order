import { openrouter } from '@openrouter/ai-sdk-provider'
import { generateText, stepCountIs } from 'ai'
import 'dotenv/config'
import { createAiTools } from '../services/ai-tools'
import { promptBuilderService } from '../services/prompt-builder.service'
// chalk is ESM-only, use dynamic import
let chalk: any

/**
 * AI Assistant V2 - Automated Evaluation Suite
 *
 * This script bypasses Fastify/HTTP and validates the core LLM pipeline.
 * Run via: npx tsx src/scripts/eval-ai.ts
 */

const testCases = [
  {
    name: 'General greeting and capability',
    input: 'Chào bạn, bạn có thể làm gì cho tôi?',
    expectedIncludes: ['món', 'nhà hàng']
  },
  {
    name: 'Menu keyword search via tools',
    input: 'Quán có món chay nào không?',
    expectedTool: 'searchMenu'
  },
  {
    name: 'Semantic search via RAG',
    input: 'Tôi muốn ăn gì đó nhẹ nhàng, hợp với bia',
    expectedTool: 'searchMenuSemantic'
  },
  {
    name: 'Dish detail lookup',
    input: 'Cho tôi biết chi tiết món phở bò',
    expectedTool: 'getDishDetails'
  },
  {
    name: 'Off-topic rejection',
    input: 'Write me a poem about spring',
    expectedIncludes: ['restaurant']
  }
]

async function runEvaluations() {
  chalk = (await import('chalk')).default
  console.log(chalk.blue.bold('\n🚀 Starting AI Assistant Evaluation Suite\n'))

  const systemPrompt = await promptBuilderService.buildSystemPrompt('eval-test')

  let passed = 0
  let failed = 0

  for (const tc of testCases) {
    console.log(chalk.yellow(`\n▶ Running: ${tc.name}`))
    console.log(`  Input:  "${tc.input}"`)

    try {
      const response = await generateText({
        model: openrouter.chat('google/gemini-2.5-flash'),
        system: systemPrompt,
        messages: [{ role: 'user', content: tc.input }],
        tools: createAiTools({}),
        stopWhen: stepCountIs(5)
      })

      const textLower = response.text.toLowerCase()
      let isSuccess = true
      let failureReason = ''

      // Check inclusion
      if (tc.expectedIncludes) {
        for (const expected of tc.expectedIncludes) {
          if (!textLower.includes(expected.toLowerCase())) {
            isSuccess = false
            failureReason = `Did not contain expected keyword: "${expected}"`
            break
          }
        }
      }

      // Check tool usage
      if (tc.expectedTool && isSuccess) {
        const usedTools = response.toolCalls?.map((t: any) => t.toolName) || []
        if (!usedTools.includes(tc.expectedTool)) {
          isSuccess = false
          failureReason = `Expected tool "${tc.expectedTool}" wasn't called. Tools called: ${usedTools.join(', ')}`
        }
      }

      if (isSuccess) {
        console.log(chalk.green(`  [PASS] Expected behavior matched.`))
        passed++
      } else {
        console.log(chalk.red(`  [FAIL] ${failureReason}`))
        console.log(chalk.gray(`  Actual response: "${response.text}"`))
        failed++
      }
    } catch (e: any) {
      console.log(chalk.red(`  [ERROR] Execution failed: ${e.message}`))
      failed++
    }
  }

  console.log(chalk.cyan.bold('\n📊 Evaluation Summary'))
  console.log(
    `Total: ${testCases.length} | ` + chalk.green(`Passed: ${passed}`) + ' | ' + chalk.red(`Failed: ${failed}\n`)
  )
}

runEvaluations().catch(console.error)
