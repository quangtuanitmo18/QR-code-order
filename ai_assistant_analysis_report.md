# Comprehensive AI Assistant Architecture & Action Plan

This document serves as the master blueprint and analysis report for the Restaurant AI Assistant. It details the current architecture, technologies, operational workflows, and the strategic roadmap for achieving a fully mature, production-ready Agentic AI.

---

## I. Current System Architecture & Capabilities

The AI Assistant has evolved from a simple chatbot wrapper into a structured **Multi-Agent System** that acts as an intelligent waiter, order taker, and receptionist.

### 1. Technology Stack

- **AI Orchestration:** [Vercel AI SDK](https://sdk.vercel.ai/) (`generateObject`, `streamText`, `tool`).
- **LLM Provider:** [OpenRouter](https://openrouter.ai/) (providing seamless model switching).
- **Core Model:** Google Gemini 2.5 Flash (`google/gemini-2.5-flash`) - chosen for ultra-fast latency and high intelligence, enabling rapid routing and conversational generation.
- **RAG & Vector Database:** [ChromaDB](https://www.trychroma.com/) (Cloud Client) for storing menus and FAQs.
- **Embeddings:** `jina-embeddings-v3` (via Jina AI) for multilingual text representation.
- **Data Validation:** Zod (for strict JSON schema definition of AI Tools and Routing outputs).
- **Database:** Prisma ORM connected to PostgreSQL/SQLite for exact-match searching and order execution.

### 2. The Multi-Agent Architecture

The system employs a **Supervisor-Worker Pattern** to eliminate the cognitive overload of throwing 10+ tools into a single LLM prompt.

#### A. The Supervisor (`ai-router.service.ts`)

- **Role:** The entry point for all user messages.
- **Mechanism:** It reads the last 4 messages and uses `generateObject` (with a strict `IntentSchema`) to classify the user's _Primary Intent_ within milliseconds.
- **Intents Handled:** `SEARCH`, `ORDER`, `FAQ`, `GENERAL`.

#### B. The Workers (Sub-Agents)

Based on the Supervisor's decision, `ai-chat.service.ts` dynamically injects only the necessary tools into the `streamText` function.

1. **Search Agent (`search.agent.ts`)**
   - **Purpose:** Handling menu discovery and dish inquiries.
   - **Tools:**
     - `searchMenu`: Fast SQL-based exact match search (using `ILIKE` on names, categories, tags).
     - `searchMenuSemantic`: ChromaDB vector search for conceptual queries ("spicy vegan food"). Falls back to SQL if RAG fails.
     - `getDishDetails`: Retrieves deep context (ingredients, allergens) for a specific dish.
     - `getMenuCategories`: Lists available categories and dish counts.
     - `getPopularDishes`: Deterministic SQL aggregation of past orders to return best-sellers.

2. **Order Agent (`order.agent.ts`)**
   - **Purpose:** Handling shopping cart, checkout, and promotions (Requires a verified Guest Session via QR Code).
   - **Tools:**
     - `placeOrder`: Adds items to the cart/creates an order.
     - `getOrderStatus`: Retrieves the current bill and items ordered.
     - `cancelOrder`: Cancels pending orders.
     - `getAvailableCoupons`: Lists active promotions for the guest.
     - `applyCoupon`: Attaches a discount code to the cart.

3. **FAQ Agent (`faq.agent.ts`)**
   - **Purpose:** Acting as the restaurant receptionist.
   - **Tools:**
     - `getRestaurantInfo`: Fetches hardcoded UI strings/settings (WiFi password, address, opening hours).
     - `searchFAQ`: Semantic vector search against the internal FAQ database.

### 3. Memory Architecture

The system implements a **2-Tier Memory System** (`ai-memory.service.ts`):

1. **Tier 1 (Hot Window):** The exact raw text of the most recent N messages is sent to the LLM.
2. **Tier 2 (Progressive Summary):** When older messages fall out of the Hot Window, a background LLM process summarizes them into a concise paragraph. This summary is injected directly into the `System Prompt`, ensuring the AI remembers the entire conversational arc without blowing up token budgets (The "Lost in the Middle" fix).

---

## II. GAPs Analysis vs. Best Practices

While the current architecture is leaps and bounds ahead of standard wrappers, it still falls short of "Production-Ready Agentic AI" in four critical areas:

### GAP 1: Basic RAG (Missing Query Expansion & Hybrid Search)

- **Current State:** `searchMenuSemantic` takes the raw user query (e.g., "sữa hạt" - nut milk) and throws it directly into ChromaDB.
- **The Flaw:** Vector search calculates mathematical distance. For exact brand names, unique compounds, or Vietnamese slang, vector distance can return wildly inaccurate ("hallucinated") results compared to simple keyword matching. If ChromaDB fails, SQL `searchMenu` is called as a separate fallback turn.
- **The Fix:** Implement **Advanced RAG**.
  1. _Query Expansion:_ intercept "sữa hạt" and expand it via a Synonym Dictionary `["sữa hạt", "sữa hạt macca", "sữa hạt điều"]`.
  2. _Hybrid Search:_ Run ChromaDB and SQL Full-Text Search _concurrently_.
  3. _Reranking:_ Merge the results and score them, ensuring exact keyword matches always outrank fuzzy semantic matches.

### GAP 2: Single-Intent Bottleneck (Missing Parallel Execution)

- **Current State:** The AI Router forces the selection of a _single_ primary intent.
- **The Flaw:** Humans talk in multi-intents: _"Order a pizza and tell me the WiFi password."_ The current router will drop one of these requests.
- **The Fix:** Update the `IntentSchema` to output an array: `['ORDER', 'FAQ']`. The orchestrator must then run the Order Agent and FAQ Agent tools in parallel.

### GAP 3: Lacking Smart Response Synthesizer

- **Current State:** The system streams text directly from whichever Agent was chosen.
- **The Flaw:** If we fix GAP 2 (running multiple agents), streaming raw text from two different agents concurrently will result in chaotic, disjointed chat bubbles.
- **The Fix:** Introduce a final **Synthesizer Node**. The parallel agents must return _raw JSON data_ instead of strings. A final LLM pass takes the data from both the Order and FAQ agents and streams a single, natural, blended response back to the user.

### GAP 4: Missing Tier 3 Memory (Entity / State Storage)

- **Current State:** We have Hot Memory and Progressive Summaries.
- **The Flaw:** Progressive summaries are fluid. If a user states, _"I am deathly allergic to peanuts"_, that fact might eventually get summarized out or diluted over a long session.
- **The Fix:** Implement an **Entity Extractor**. A background process that listens for concrete, unchangeable facts (allergies, preferences, dietary restrictions) and saves them exclusively to PostgreSQL/Redis. These generic facts are then injected at the very top of the system prompt for _every_ future conversation, permanently personalizing the AI.

---

## III. Execution Roadmap

To eliminate the gaps above, development should proceed in the following order:

1. **Phase 1: Advanced Hybrid RAG (Addresses GAP 1)**
   - _Effort:_ Medium | _Impact:_ Massive (Solves 90% of user search frustration).
   - _Action:_ Create a Synonym Dictionary module and update `search.agent.ts` to perform concurrent SQL + Chroma queries with basic array-merge reranking.

2. **Phase 2: Entity State Memory (Addresses GAP 4)**
   - _Effort:_ Low | _Impact:_ High (Permanent Personalization).
   - _Action:_ Create an extractor tool that saves `{ allergies: [], preferences: [] }` to the session/guest DB profile and update `prompt-builder.service.ts`.

3. **Phase 3: Multi-Intent & Synthesizer (Addresses GAPs 2 & 3)**
   - _Effort:_ High | _Impact:_ High (True Human-Level Interaction).
   - _Action:_ Re-architect `ai-router.service.ts` to output arrays, and overhaul the orchestration loop in `ai-chat.service.ts`.
