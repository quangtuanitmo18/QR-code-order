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

    // 2. Fetch FAQs
    const faqs = await prisma.fAQ.findMany()
    const faqContext = faqs.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')

    // 3. Build Final Prompt
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
6. When recommending dishes, DO NOT hallucinate. Use the tools provided to search the menu.`
  }
}

export const promptBuilderService = new PromptBuilderService()
