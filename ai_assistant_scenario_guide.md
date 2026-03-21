# AI Assistant — Readiness & Scenario Guide

> **Status:** ✅ Ready  
> **Last reviewed:** 2026-03-21  

---

## 1. Guest AI Assistant

### Architecture Overview

```text
User Message
    │
    ▼
ai-chat.service.ts          ← Orchestrator (multi-intent DAG)
    │
    ├─► Intent Planner       ← Classifies into: [SEARCH, ORDER, FAQ, MIXED]
    │
    ├─► Search Agent         ← search.agent.ts  (searchMenu, searchMenuSemantic, getDishDetails,
    │                                             getMenuCategories, getPopularDishes)
    │
    ├─► Order Agent (HITL)   ← order.agent.ts   (placeOrder*, cancelOrder*, applyCoupon*,
    │                                             getOrderStatus, getAvailableCoupons)
    │                          * HITL = Human-in-the-loop (frontend confirms, REST executes)
    │
    ├─► FAQ Agent            ← faq.agent.ts     (searchFAQ, getRestaurantInfo)
    │
    └─► prompt-builder.service.ts  ← System prompt (no FAQ injection, uses searchFAQ tool)
```

**Order execution flow:**
```text
AI calls placeOrder (HITL, no execute)
    → Frontend shows confirmation card with item list
    → User clicks Confirm
    → POST /api/ai-chat/execute-action
    → guestService.placeOrderById()
        ├─ Tier 1: dishId lookup (most reliable)
        ├─ Tier 2: SQL name match (exact → partial)
        └─ Tier 3: Semantic search fallback (handles multilingual/translated names)
```

### 🟢 Happy Path Scenarios (Guest)

#### S1 — Keyword menu search
```text
User: "Do you have spring rolls?"
Flow: searchMenu("spring rolls") → [{id: 12, name: "Spring Rolls", price: 3, ...}]
AI:   "Yes, Spring Rolls are $3. Would you like to order?"
```

#### S2 — Semantic / vague search
```text
User: "I want something light and fresh"
Flow: searchMenuSemantic("something light and fresh") → [{id: 5, name: "Mixed Green Salad", ...}]
AI:   Lists options with prices
```

#### S3 — Multilingual search (Vietnamese / Russian)
```text
User: "có salad không?"
Flow: searchMenuSemantic("có salad không?") → [{id: 5, name: "Mixed Green Salad", ...}]
AI:   Responds in Vietnamese with correct data
```

#### S4 — Order after search (the critical flow)
```text
User: "give me 2 salads"
Flow: AI calls placeOrder({items: [{dishId: 5, dishName: "Mixed Green Salad", quantity: 2}]})
      Frontend shows: "Place order (2 items): Mixed Green Salad × 2"
      User clicks Confirm → POST /execute-action → placeOrderById(dishId: 5) ✅
```

#### S5 — Popular dishes → order
```text
User: "What's most popular here?"
Flow: getPopularDishes() → [{id: 12, name: "Spring Rolls", totalOrdered: 48}, ...]
User: "Give me 1 spring roll"
Flow: placeOrder({items: [{dishId: 12, dishName: "Spring Rolls", quantity: 1}]}) ✅
```

#### S6 — FAQ question
```text
User: "Is parking available?"
Flow: searchFAQ("parking") → {answer: "Free parking is available..."}
AI:   Answers from FAQ data, does NOT guess
```

#### S7 — Apply coupon
```text
User: "I have a coupon SAVE10"
Flow: getAvailableCoupons() → shows available coupons
      applyCoupon({couponCode: "SAVE10", orderId: 42}) ← HITL, user confirms
      POST /execute-action → guestService.applyCoupon()
```

#### S8 — Cancel order
```text
User: "Cancel my order"
Flow: getOrderStatus() → [{orderId: 42, status: "Pending", ...}]
      cancelOrder({orderId: 42}) ← HITL, user confirms, red UI
      POST /execute-action → guestService.cancelOrder()
```

#### S9 — Check bill
```text
User: "What's my total?"
Flow: getOrderStatus() → list of orders with totalAmount
AI:   Summarizes items and total cost
```

#### S10 — Multi-intent in one message
```text
User: "What's on the menu and do you have wifi?"
Flow: DAG executes in parallel:
      Task A: searchMenuSemantic("menu overview") + getMenuCategories()
      Task B: searchFAQ("wifi password")
AI:   Responds with both answers in one message
```

### 🟡 Edge Case Scenarios (Guest)

#### E1 — Dish name translated by AI (multilingual safety net)
```text
AI presents "Mixed Green Salad" as "Salad Trộn" in Vietnamese
User confirms order
placeOrder({items: [{dishName: "Salad Trộn"}]})  ← no dishId (shouldn't happen but might)
Flow: Tier 1 (dishId) fails → Tier 2 (SQL "Salad Trộn") fails
      → Tier 3: hybridRagService.searchMenu("Salad Trộn")
              returns [{id: 5, name: "Mixed Green Salad"}]
      → placeOrderById(dishId: 5) ✅
```

#### E2 — Dish not found at all
```text
User: "Order a pizza"
Flow: searchMenuSemantic → no results
AI:   "Sorry, we don't have pizza. Here are some alternatives..."
      Does NOT call placeOrder
```

#### E3 — Order already paid / not cancellable
```text
User: "Cancel order #42"
placeOrder is Paid/Processing status
API:  Returns error "Only Pending orders can be cancelled"
UI:   Shows error card with specific message + Retry button
```

#### E4 — Coupon already used / expired
```text
User: "Apply SAVE10"
API:  Returns error "Coupon SAVE10 has already been used"
UI:   Shows error card with specific message
```

#### E5 — Guest session expired (no guestId)
```text
User: "What's my order?"
Flow: getOrderStatus() → {message: "Unable to identify your session. Please scan the QR code again."}
AI:   Asks user to re-scan QR code
```

#### E6 — AI calls too many tools (complex flow)
```text
User: "Search menu, recommend something, check coupons, and order 2 dishes"
Flow: stepCountIs(8) — allows up to 8 tool calls per response
      If limit hit: AI stops gracefully, responds with partial results
      User can continue in next message
```

#### E7 — Network / ChromaDB timeout
```text
searchMenuSemantic() → hybridRagService timeout
Flow: Falls back to sqlSearchDishes() automatically
AI:   Returns SQL results without error (user sees normal results)
```

#### E8 — AI hallucinates a dish name
```text
AI: "We have a BigMac for $5"  ← invented name
User: "Order it"
Flow: placeOrder({dishName: "BigMac"})
      Tier 1: no dishId → Tier 2: SQL → not found → Tier 3: semantic → low/no match
      → Error: "Could not find dish BigMac. Please search the menu first."
UI:   Error card with Retry button
```

---

## 2. Admin AI Assistant

### Architecture Overview
```text
User Message (Owner/Employee)
    │
    ▼
admin-ai-chat.service.ts    ← Orchestrator (Multi-Intent Pipeline & DAG Execution)
    │
    ├─► Admin Router        ← Classifies into tasks & builds DAG
    │
    ├─► Analytics Agent     ← admin-analytics.agent.ts (admin_get_revenue_trends, admin_get_dish_performance)
    │
    ├─► Orders Agent        ← admin-orders.agent.ts (admin_get_live_orders, admin_search_orders, admin_cancel_order*)
    │
    └─► Menu Agent          ← admin-menu.agent.ts (admin_update_dish*)

* HITL = Human-in-the-loop (frontend calls REST execute-action API upon confirmation)
```

**Admin Action execution flow:**
```text
AI calls admin_update_dish or admin_cancel_order (HITL, no execute)
    → Task is marked as "blocked" (needs user confirmation)
    → Multi-Intent DAG pauses and saves state to PendingExecution
    → Frontend shows confirmation card for the specific action
    → Admin clicks "Confirm" or "Reject"
    → POST /api/admin-ai-chat/execute-action with user reply
    → DAG resumes execution with the blocked task resolved
```

### 🟢 Happy Path Scenarios (Admin)

#### A1 — Revenue Query
```text
Admin: "Show me the revenue from March 1st to March 14th"
Flow: admin_get_revenue_trends(startDate: "2026-03-01T...", endDate: "2026-03-14T...")
AI:   Summarizes the revenue trends and sales data naturally.
```

#### A2 — Dish Performance Query
```text
Admin: "What are our 3 worst-selling dishes?"
Flow: admin_get_dish_performance(sortBy: "worst", limit: 3)
AI:   Lists the worst-performing dishes based on order volume.
```

#### A3 — Live Floor / Operations Overview
```text
Admin: "How are we doing right now?"
Flow: admin_get_live_orders()
AI:   Summarizes active tables, pending orders, and currently serving status.
```

#### A4 — Historical Order Search
```text
Admin: "Find the order from John yesterday at table 2"
Flow: admin_search_orders(guestName: "John", tableNumber: 2)
AI:   Returns the specific historical order details.
```

#### A5 — Update Dish Status (HITL)
```text
Admin: "Spring rolls are out of stock. Mark them as unavailable."
Flow: admin_update_dish(dishId: 12, updates: { status: "Unavailable" })
      → Task BLOCKED
      → Frontend shows confirmation card: "Update Spring Rolls to Unavailable?"
      → Admin clicks Confirm
      → Execute API updates database
      → AI replies "Spring rolls are now marked as unavailable."
```

#### A6 — Force Cancel Order (HITL)
```text
Admin: "Cancel order #105, customer walked out."
Flow: admin_cancel_order(orderId: 105, reason: "customer walked out")
      → Task BLOCKED
      → Frontend shows confirmation card: "Cancel Order #105?"
      → Admin clicks Confirm
      → Execute API cancels the order
      → AI replies "Order #105 has been cancelled."
```

#### A7 — Multi-Intent Admin Request
```text
Admin: "What's our revenue this month and cancel order #42."
Flow: DAG executes in parallel:
      Task A: admin_get_revenue_trends(...)
      Task B: admin_cancel_order(orderId: 42) → BLOCKED
AI:   Shows revenue data immediately and presents the confirmation card to cancel order #42.
```

### 🟡 Edge Case Scenarios (Admin)

#### E1 — Admin context missing (Unauthorized)
```text
Condition: session lacks valid accountId during tool execution
Flow: Tool authGuard() returns "Unauthorized. Admin context missing."
AI:   Informs the user that they lack the necessary permissions to perform the action.
```

#### E2 — Vague timeframe for revenue
```text
Admin: "How is revenue?"
Flow: AI infers default practical dates (e.g., last 7 days) and calls admin_get_revenue_trends.
AI:   "Here is the revenue for the last 7 days..."
```

#### E3 — Low Confidence Multi-Intent
```text
Admin: "Do something with the menu and orders"
Flow: Router confidence < 0.5
AI:   Stops execution and asks for confirmation: "Did you mean to search orders and update dish?"
```
