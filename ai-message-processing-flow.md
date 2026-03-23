# Multi-Intent AI Pipeline

This document details the end-to-end journey of a complex user prompt, traveling from the Frontend through the Backend architecture layers, until the final response is generated.

## 1. Example: A Complex Message

Suppose a customer sits at Table 5, scans the QR code, and types:

> _"I'm allergic to peanuts, does the restaurant have any safe salads? Also I'd like to order 1 portion and 2 iced teas please. What's the wifi password?"_

This message actually contains 3 distinct intents:

1. **Search Product**: Wants to find a salad with a strict dietary restriction (No peanuts).
2. **Place Order**: Wants to order 1 portion of salad (specific item ID unknown) and 2 iced teas.
3. **FAQ**: Asking for the Wifi password.

---

## 2. End-to-End Pipeline

Here are the 7 stages this message goes through in the `server/src` directory:

### 📍 Stage 1: Security & Rate Limiting (Budget Gate)

- The message hits `ai-chat.service.ts`.
- **Validation:** The system runs `validateMessageContent(messages)` to ensure the payload doesn't contain XSS payloads, Prompt Injection attempts, and is under the 2000-character limit.
- **Token Budget:** It checks `ai-memory.service.ts` to see if Table 5 (this Session) has exceeded the `50,000 tokens` limit. If the budget applies, it proceeds to Stage 2.

### 📍 Stage 2: Memory Restoration

- The guest might have sent 20 messages prior to this, but feeding all 20 into the LLM is slow and costly.
- The system uses a **Sliding Window** algorithm: It fetches exactly the last 8 messages (Hot Messages).
- If older messages fall out of the window, the AI quickly runs a **Progressive Summary** function to distill the old context into a short paragraph: _"Guest is Linh, likes sweets"_. This summary is dynamically injected into the System Prompt.

### 📍 Stage 3: Multi-Intent Recognition (Task Planner - LLM 1)

Instead of forcing the AI to search and order simultaneously (which causes hallucinations), the message is parsed through `ai-router.service.ts`. Here, a fast AI model (usually Gemini 2.5 Flash) acts as a "Dispatcher", breaking down the request into a Directed Acyclic Graph (DAG) task list:

```json
{
  "tasks": [
    { "id": "t1", "intent": "search_faq", "params": { "query": "wifi password" } },
    {
      "id": "t2",
      "intent": "search_product",
      "params": { "query": "salad", "allergenExclusion": "peanut" }
    },
    {
      "id": "t3",
      "intent": "place_order",
      "params": {
        "items": [
          { "name": "salad", "qty": 1 },
          { "name": "iced tea", "qty": 2 }
        ]
      }
    }
  ],
  "suggestedDependencies": [
    {
      "from": "t2",
      "to": "t3",
      "reason": "Needs the safe salad result before placing the order (t3)"
    }
  ]
}
```

### 📍 Stage 4: Task Execution (DAG Executor)

The system (`task-executor.ts`) receives the JSON above and executes the tools either in parallel or sequentially based on dependencies:

**Task 1 (t1) - Search Wifi:** Routes directly to the FAQ RAG tool. Instantly returns `"Wifi password is VuiVe123"`. Fast and exact.

**Task 2 (t2) - Search Safe Salad:** (Passed into the **Hybrid RAG Layer**)

- **Extraction:** Detects keywords: `Category="Salad"`, `AllergenExclusion="peanut"`.
- **Expansion (Query Expansion):** "Salad" = `["salad", "mixed greens", "coleslaw"]`.
- **3-Way Retrieval:**
  1. _SQL DB_ pulls all salad items.
  2. _Vector DB_ (ChromaDB) finds semantically similar dishes.
  3. _Structured Filter (Hard Filter)_ stringently eliminates any dish containing "peanut" in the allergens column.
- **Scoring & Ranking (Reranking):** The results from the 3 sources are combined. Points are added for exact SQL name matches, and for Vector semantic similarity. Notably, if an item is found by BOTH SQL and Vector, it receives a massive "Multi-Source Bonus". The system sorts and picks the Top 2 highest-scoring dishes.
- **Result:** Returns "Lotus Stem Shrimp Meat Salad (Price: $5, No Peanuts)" and "Salmon Salad (Price: $7)".

**Task 3 (t3) - Place Order:**

- Discovers that `t2` returned TWO possible safe salads. The system cannot arbitrarily guess which one the customer wants to order.
- Task `t3` is suspended (Status: **BLOCKED - Awaiting Confirmation**). This state is saved to the Database (`PendingExecution` table) awaiting the customer's next message.

### 📍 Stage 5: Context Assembly

All gathered results are bundled together:

- `t1`: Wifi is VuiVe123.
- `t2`: Found 2 safe salads (Lotus Stem, Salmon).
- `t3`: Blocked; needs the customer to pick a salad.

All this data forms a highly accurate System Prompt context.

### 📍 Stage 6: Response Generation (Final LLM - Response Streaming)

The primary LLM receives the prompt with the complete Context from Stage 5 and begins typing the response to the customer (using SSE Streaming, words appear on the guest's phone in real-time).

> **AI Response:** _"Yes, the restaurant's wifi password is **VuiVe123**. Regarding the salad, the kitchen currently has **Lotus Stem Shrimp Meat Salad** and **Salmon Salad** which are completely peanut-free. Which one would you like me to order along with the 2 iced teas?"_

### 📍 Stage 7: History Storage & Ledger (Post-processing)

- The AI's response is appended to the conversation history array.
- Saved to the Prisma Database (`AiChatSession`).
- Token consumption is updated (Token Tracking functionality).
- The entire customer message flow completes in under 3 seconds!

---

_(This architecture ensures the AI behaves exactly like a real-life professional waiter: It filters dangerous requests, listens carefully to constraints, splits tasks to ask the kitchen, and replies fluidly)._
