# DAG Executor: Mechanism & Application in the Project

## 1. What is a DAG Executor?
A DAG (Directed Acyclic Graph) Executor is a mechanism for scheduling and executing tasks based on their mutual dependencies. This graph must meet two conditions:
- **Directed**: Tasks must run in a specific direction (Task A must finish before Task B).
- **Acyclic**: No circular dependencies are allowed (A waits for B, B waits for C, C waits for A).

In AI Agentic systems, when a user gives a prompt containing **multiple actions (Multi-Intent)**, the Agent Planner breaks that prompt down into smaller tasks. The DAG Executor then decides:
- Which tasks can run concurrently (Parallel) to save time.
- Which tasks must run sequentially because they require output data from a previous task.

---

## 2. How is the DAG Executor applied in QR-code-order?

The entire DAG logic is implemented in the `server/src/services/task-executor.ts` file and integrated with the Router in `admin-ai-router.service.ts`.

### Step 1: Routing & Planning
When the Admin chats: *"Check revenue this month, get a list of the worst dishes, and cancel order #105"*
`AdminAiRouterService` uses a prompt + schema (`AdminTaskPlanSchema`) to decompose the message into 3 tasks:
1. `admin_get_revenue_trends`
2. `admin_get_dish_performance`
3. `admin_cancel_order` (receives parameter `orderId: 105`)

### Step 2: Build DAG
The `buildDAG()` function maps these tasks into Nodes.
- It collects **Explicit Dependencies** (suggested by the AI Router - e.g., task 3 needs output data from task 2).
- It automatically assigns **Implicit Dependencies**: Tasks that modify data (`write`, `transaction`) must automatically wait for read tasks (`read`) on the same `resource` to complete first to ensure database consistency.

### Step 3: Cycle Detection
The `hasCycle()` function iterates through the graph to ensure the AI provides a plan without deadlocks. If a loop is detected (e.g., search dish -> cancel dish -> need to search dish again to get output), the Executor safely downgrades and runs ALL tasks sequentially.

### Step 4: Topological Execution
The `executeTasksV2()` function scans all nodes:
- Tasks that DO NOT depend on anything (or their parents have finished) are put in the execution queue (`ready`).
- The `groupByParallelSafety()` function evaluates whether these ready tasks can run in **Parallel** concurrently using `Promise.allSettled()` (e.g., querying revenue and querying best dishes are 2 independent read functions).

### Step 5: State Forwarding
If Task B depends on Task A, the `injectDependencyResults()` function injects the results of Task A (e.g., the ID of a newly found order) directly into Task B's parameters via the `__priorResults` or `__autoPickedResult` variables so Task B automatically executes without needing to ask the LLM again.

### Step 6: Human-in-the-Loop (HITL) Pausing
For dangerous actions like Canceling orders or Changing dish prices (`actionType === 'write'`), the DAG Executor does not run immediately!
- The `canExecuteMutationV2()` function intervenes and marks the task as `blocked`.
- The DAG Pipeline pauses entirely. The full state (context + data of successfully executed tasks) is serialized and stored in temporary memory using the `savePendingExecution()` function.
- It waits for the Admin on the frontend to click the "Confirm" button.
- Once the Admin confirms via the REST API `/execute-action`, the DAG warms up, injects the confirmation command into Task B, and resumes the DAG right where it paused, proceeding to run the remaining tasks (if any).

### Step 7: Idempotency (Preventing double execution)
The `checkDuplicate` and `getIdempotencyKey` functions strictly lock `write` actions using a single unique key generated from the sessionId and TaskID. Even if the user spam reloads or retypes the command, the Cancel Order or Checkout action will not run twice in the database.

### Step 8: Trace Persistence
After completion (or being blocked), the `persistTrace` function pushes this entire graph execution process into the database in the background (non-blocking) via the `ExecutionTrace` model for Audit and performance Logging purposes for the Owner to view.

---

### Summary

Instead of using the traditional "ReAct Pattern" (Action -> Observe -> Reason loop) which consumes many tokens and is slow (taking 20-30s for multiple tools), the project's **DAG Executor** *plans everything upfront and executes multi-threaded*, helping to:
1. Reduce LLM call cycles from N loops down to 1-2 loops.
2. Save latency by utilizing `Promise.all` across independent Tool calls.
3. Ensure 100% safety through HITL, Idempotency, and Implicit Write-locks.
