import { openrouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import chalk from 'chalk'
import 'dotenv/config'
import { aiTools } from '../services/ai-tools'

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
    input: 'Viết cho tôi một bài thơ về mùa xuân',
    expectedIncludes: ['xin lỗi']
  }
]

async function runEvaluations() {
  console.log(chalk.blue.bold('\n🚀 Starting AI Assistant Evaluation Suite\n'))

  const systemPrompt = `Bạn là nhân viên AI chăm sóc khách hàng tại nhà hàng QR Order. 
Bạn chỉ được phép trả lời các câu hỏi liên quan đến nhà hàng, thực đơn, và dịch vụ tại quán.
Từ chối mọi yêu cầu nằm ngoài phạm vi nhà hàng (ví dụ: làm bài tập, viết thơ, lập trình).
Luôn dùng tiếng Việt lịch sự.`

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
        tools: aiTools,
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
