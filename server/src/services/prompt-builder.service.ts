import prisma from '@/database'

class PromptBuilderService {
  async buildSystemPrompt(userId: string): Promise<string> {
    // 1. Fetch Restaurant Settings
    const settings = await prisma.restaurantSetting.findMany()
    const settingsMap = settings.reduce(
      (acc, current) => {
        acc[current.key] = current.value
        return acc
      },
      {} as Record<string, string>
    )

    const restaurantInfo = `
Restaurant Name: ${settingsMap['company_name'] || 'Our Restaurant'}
Opening Hours: ${settingsMap['opening_hours'] || 'Unknown'}
Address: ${settingsMap['address'] || 'Unknown'}
Wi-Fi Password: ${settingsMap['wifi_password'] || 'Unknown'}
`.trim()

    // 2. Fetch FAQs (limit to 20 for token efficiency)
    const faqs = await prisma.fAQ.findMany({ take: 20 })
    const faqContext = faqs.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')

    // 3. Build Final Prompt with tool usage instructions
    return `You are a helpful and polite AI Customer Assistant for a restaurant.
Your role is to help customers who have scanned the QR code at their table.

--- RESTAURANT INFORMATION ---
${restaurantInfo}

--- FREQUENTLY ASKED QUESTIONS ---
${faqContext}

--- INSTRUCTIONS ---
1. Recommend dishes and menus based on customer preferences or dietary needs.
2. Provide details about dish ingredients and warn about potential allergens.
3. Answer frequently asked questions based on the above information.
4. Refuse requests gracefully if they are off-topic or unrelated to the restaurant. Include this exact phrase if completely off-topic: "Xin lỗi anh/chị, em chỉ là trợ lý tư vấn món ăn của nhà hàng, em không thể giải đáp vấn đề này ạ".
5. Communicate in the language the user is speaking in, but prioritize Vietnamese if ambiguous.

--- TOOL USAGE ---
6. You have THREE search tools. Choose the right one:
   - 'searchMenu': SQL keyword search. Use for EXACT dish names or categories (e.g., "phở bò", "Appetizers").
   - 'searchMenuSemantic': AI-powered semantic search. Use for VAGUE, DESCRIPTIVE, or MULTILINGUAL queries (e.g., "something light", "good with beer", "vegetarian food").
   - 'getDishDetails': Get full details of a specific dish by name.
7. When in doubt between searchMenu and searchMenuSemantic, prefer searchMenuSemantic — it understands meaning better.
8. DO NOT make up dish names or prices. Only use data from tool results.
9. If a tool returns no results, let the customer know politely and suggest alternatives.
10. When presenting dish results, format them nicely with name, price, and description.
11. You may call multiple tools in sequence if needed (e.g., semantic search first, then get details).`
  }
}

export const promptBuilderService = new PromptBuilderService()
