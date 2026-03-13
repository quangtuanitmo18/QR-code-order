# Comprehensive AI Assistant Architecture & Report

This document serves as the master blueprint and analysis report for the Restaurant AI Assistant, covering both the **Guest AI** and **Admin AI**.

---

## I. Current System Architecture & Capabilities

The AI Assistant has evolved from a simple chatbot into a structured **Multi-Agent System** featuring intent routing, parallel DAG execution, and human-in-the-loop safety.

### 1. Technology Stack

- **AI Orchestration:** [Vercel AI SDK v6](https://sdk.vercel.ai/) (`generateObject`, `streamText`, `createUIMessageStream`).
- **LLM Provider:** [OpenRouter](https://openrouter.ai/) (Core Model: Google Gemini 2.5 Flash).
- **RAG & Vector Database:** ChromaDB + Jina AI embeddings (`jina-embeddings-v3`) for menu and FAQs.
- **Data Validation:** Zod (for strict JSON schema definition of AI Tools and Routing outputs).
- **Database:** Prisma ORM connected to PostgreSQL/SQLite.

### 2. The Multi-Agent Architecture (Guest & Admin)

Both Guest and Admin AI utilize a **Planner-Executor Pattern** via a Multi-Intent Router and a Directed Acyclic Graph (DAG) task executor.

#### A. Guest AI

1. **The Planner (`ai-router.service.ts`):**
   - Analyzes user input and decomposes it into multiple atomic intents (e.g., `['place_order', 'search_faq']`).
   - Generates predictable task dependencies.
2. **The Agents (Tools Grouping):**
   - **Search Agent:** Implements a **5-Layer Hybrid RAG Pipeline** (`hybrid-rag.service.ts`) for query expansion, entity extraction, and concurrent SQL + Vector search + filtering, followed by weighted reranking.
   - **Order Agent:** Handles cart management, checkout, and coupons.
   - **FAQ Agent:** Handles structured restaurant info and semantic FAQ searches.
3. **The Executor (`task-executor.ts`):**
   - Runs tasks in parallel or sequentially based on DAG dependencies. Results are injected back into the final Synthesizer (Gemini) to generate a cohesive response.

#### B. Admin AI

1. **The Planner (`admin-ai-router.service.ts`):**
   - Analyzes owner/admin input and decomposes it into admin-specific tasks (e.g., `admin_get_revenue_trends`, `admin_search_orders`).
2. **The Agents:**
   - **Analytics Agent:** Business metrics (revenue, dish performance).
   - **Orders Agent:** Searches historical orders, gets live orders, and cancels orders.
   - **Menu Agent:** Updates dish prices and status.
3. **Human-in-the-Loop (HITL) Execution:**
   - Dangerous mutations (`admin_update_dish`, `admin_cancel_order`) do not execute automatically. The AI SDK pauses execution (`createUIMessageStream`) and renders a React UI Card asking the Owner to "Approve" or "Cancel". Only upon explicit approval does the backend execute the database changes.

### 3. Memory Architecture

Both assistants share a **2-Tier Memory System** (`ai-memory.service.ts`):

1. **Tier 1 (Hot Window):** The exact raw text of the most recent N messages.
2. **Tier 2 (Progressive Summary):** Background LLM summarization of older evicted messages, injected into the System Prompt to prevent token overflow.

---

## II. GAPs Analysis & Completed Milestones

### ✅ Completed Milestones

1. **Advanced Hybrid RAG (Guest AI):** Implemented the 5-layer query expansion pipeline for robust menu searching without hallucination. Admin AI omits this intentionally as it requires exact SQL matching rather than semantic fuzziness.
2. **Multi-Intent & Synthesizer:** Implemented DAG-based parallel execution for both Guest and Admin AI. Users can ask for revenues and live orders in a single breath.
3. **Human-in-the-Loop (HITL):** Admin AI securely validates destructive actions via interactive UI streaming (`createUIMessageStream`).
4. **Agent Modularity:** Both Guest and Admin tools are cleanly split into domain-specific agent files (e.g., `admin-analytics.agent.ts`, `search.agent.ts`).

### 🟡 Remaining GAPs & Next Steps

1. **Entity State / Core Memory Extraction:**
   - **Flaw:** Progressive summaries are fluid. Concrete facts like user allergies or VIP preferences might get diluted over long sessions.
   - **Fix:** Implement an explicit Entity Extractor that permanently persists `{ allergies: [], preferences: [] }` to the user profile and injects it into every system prompt.
2. **Analytics & Automated Actions (Admin AI):**
   - **Future Scope:** Enable the Admin AI to trigger proactive actions, such as sending promotional emails to customers based on the "Worst Performing Dishes" report.
