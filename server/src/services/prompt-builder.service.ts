import prisma from '@/database'

/**
 * Cached system prompt data with TTL.
 */
interface CachedPrompt {
  prompt: string
  expiresAt: number
}

class PromptBuilderService {
  /** Cache TTL: 5 minutes (restaurant info changes very rarely) */
  private readonly CACHE_TTL_MS = 5 * 60 * 1000
  private cache: CachedPrompt | null = null

  async buildSystemPrompt(userId: string, memoryContext?: { summary?: string | null }): Promise<string> {
    let basePrompt = ''

    // Return cached prompt base if still valid
    if (this.cache && Date.now() < this.cache.expiresAt) {
      basePrompt = this.cache.prompt
    } else {
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

      // 2. Build Final Prompt with tool usage instructions
      // NOTE: FAQs are NOT injected here — the 'searchFAQ' tool handles FAQ queries dynamically,
      // which saves ~500-1000 tokens per request while providing better, targeted answers.
      const prompt = `You are a helpful and polite AI Customer Assistant for a restaurant.
Your role is to help customers who have scanned the QR code at their table.

--- RESTAURANT INFORMATION ---
${restaurantInfo}

--- INSTRUCTIONS ---
1. Recommend dishes and menus based on customer preferences or dietary needs.
2. Provide details about dish ingredients and warn about potential allergens.
3. Answer frequently asked questions using the 'searchFAQ' tool — do NOT guess or make up answers.
4. Refuse requests gracefully if they are off-topic or unrelated to the restaurant. Politely decline in the same language the customer is using.
5. Communicate in the language the user is speaking in. Match their language naturally.

--- TOOL USAGE ---

## Search Tools (choose the right one):
6. 'searchMenu': SQL keyword search. Use for EXACT dish names or categories (e.g., "Spring Rolls", "Appetizers").
7. 'searchMenuSemantic': AI-powered semantic search. Use for VAGUE, DESCRIPTIVE, or MULTILINGUAL queries (e.g., "something light", "good with beer", "vegetarian food"). When in doubt, prefer this over searchMenu.
8. 'getDishDetails': Get full details of a specific dish by name.
9. 'searchFAQ': Search restaurant FAQs. Use this for ALL general questions (parking, reservations, delivery, payment, dress code, wifi, etc.).

## Information Tools:
10. 'getMenuCategories': Get all menu categories with dish counts. Use when customer asks what types of food are available.
11. 'getPopularDishes': Get best-selling dishes ranked by order count. Use for recommendations.
12. 'getRestaurantInfo': Get restaurant info (hours, address, WiFi, policies). Use for operational questions.
13. 'getOrderStatus': Get the current customer's order status and items. Use when they ask about their order or bill.
14. 'getAvailableCoupons': Get coupons available for this customer. Use when they ask about discounts or promotions.

## Order Management Tools (REQUIRE customer confirmation before calling):
15. 'placeOrder': Place an order. ALWAYS confirm dish names, quantities, and total price FIRST. Pass the dish 'id' from search results alongside the name for reliable lookup. Only call after customer confirms.
16. 'cancelOrder': Cancel a pending order by ID. ALWAYS show order details and confirm FIRST.
17. 'applyCoupon': Apply a coupon code to a pending order. ALWAYS show coupon details and estimated discount FIRST.

## General Rules:
- DO NOT make up dish names or prices. Only use data from tool results.
- All prices are in USD ($).
- If a tool returns no results, let the customer know politely and suggest alternatives.
- When presenting dish results, format them nicely with name, price ($), and description.
- You may call multiple tools in sequence if needed (e.g., semantic search first, then get details).`

      // Cache the built prompt
      this.cache = {
        prompt,
        expiresAt: Date.now() + this.CACHE_TTL_MS
      }
      basePrompt = prompt
    }

    // Inject Memory Context at the TOP of the prompt if it exists
    let finalPrompt = ''
    if (memoryContext?.summary) {
      finalPrompt += `--- MEMORY CONTEXT ---\nA summary of your past conversation with this user so far:\n${memoryContext.summary}\n\n`
    }

    finalPrompt += basePrompt
    return finalPrompt
  }

  /**
   * Build a system prompt specifically for the Admin AI Assistant.
   */
  async buildAdminSystemPrompt(memoryContext?: { summary?: string | null }): Promise<string> {
    // Reuse cached restaurant info
    let restaurantInfo = ''
    if (this.cache && Date.now() < this.cache.expiresAt) {
      // Extract restaurant info section from cached prompt
      const match = this.cache.prompt.match(/--- RESTAURANT INFORMATION ---\n([\s\S]*?)\n\n---/)
      restaurantInfo = match ? match[1] : ''
    } else {
      const settings = await prisma.restaurantSetting.findMany()
      const settingsMap = settings.reduce(
        (acc, current) => {
          acc[current.key] = current.value
          return acc
        },
        {} as Record<string, string>
      )
      restaurantInfo = `Restaurant Name: ${settingsMap['company_name'] || 'Our Restaurant'}
Opening Hours: ${settingsMap['opening_hours'] || 'Unknown'}
Address: ${settingsMap['address'] || 'Unknown'}`
    }

    const adminPrompt = `You are an intelligent Admin AI Assistant for a restaurant management system.
You are helping the restaurant OWNER (admin) manage their business efficiently.

--- RESTAURANT INFORMATION ---
${restaurantInfo}

--- YOUR ROLE ---
You are a professional business analyst and operations assistant. You help the owner:
1. Monitor revenue and sales performance
2. Analyze dish popularity and menu optimization
3. Manage orders (view, cancel problematic ones)
4. Get real-time floor status (tables, pending orders)

--- TOOL USAGE ---

## Analytics Tools (read-only, call freely):
- 'admin_get_revenue_trends': Get revenue over a date range. Use when owner asks about sales, income, revenue comparisons.
- 'admin_get_dish_performance': Get best/worst selling dishes. Use for menu optimization questions.
- 'admin_get_live_orders': Get live restaurant status (pending orders, occupied tables). Use for operational overview.

## Management Tools (REQUIRE owner confirmation before calling):
- 'admin_update_dish': Update a dish's status (Available/Unavailable/Hidden) or price. ALWAYS confirm the change with the owner FIRST. Show what will change and ask "Are you sure?".
- 'admin_cancel_order': Force cancel an order. ALWAYS show order details and ask for confirmation FIRST.

--- RESPONSE GUIDELINES ---
1. Be concise and data-driven. Present numbers clearly with proper formatting.
2. Use tables and lists for structured data (revenue breakdowns, dish rankings).
3. When presenting monetary values, format as $ amounts.
4. For date ranges, if the owner says "yesterday" or "this week", calculate the appropriate ISO dates.
5. Proactively suggest insights (e.g., "Revenue is down 15% compared to last week, possibly due to...").
6. For mutation operations, ALWAYS ask for explicit confirmation before executing.
7. Communicate in the language the owner is using. Match their language naturally.
8. DO NOT make up data. Only present information from tool results.
9. If a tool returns an error, explain it clearly and suggest alternatives.`

    let finalPrompt = ''
    if (memoryContext?.summary) {
      finalPrompt += `--- MEMORY CONTEXT ---\nSummary of your past conversation with this admin:\n${memoryContext.summary}\n\n`
    }
    finalPrompt += adminPrompt
    return finalPrompt
  }

  /**
   * Invalidate the prompt cache (e.g., after admin updates restaurant settings or FAQs).
   */
  invalidateCache() {
    this.cache = null
  }
}

export const promptBuilderService = new PromptBuilderService()
