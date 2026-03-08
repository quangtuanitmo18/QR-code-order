# Phân tích Code AI Assistant dựa trên Best Practices

Dựa vào file `ai_assistant_best_practices.md` và mã nguồn hiện tại (`ai-chat.service.ts`, `ai-tools.ts`, `embedding.service.ts`), dưới đây là báo cáo phân tích chi tiết về những điểm hệ thống đã làm tốt và những lỗ hổng cần cải thiện.

---

## 🟢 Những điểm đã làm rất tốt (Aligned with Best Practices)

1. **Tool Engineering (Công cụ tốt hơn Prompt):**
   - Các công cụ trong `ai-tools.ts` được định nghĩa rất rõ ràng với `zod` schema, mô tả (description) tường minh.
   - Các hàm trả về dữ liệu có cấu trúc sạch sẽ thay vì text thô (Vídụ: `placeOrder` trả về `orderId`, `items`, `totalAmount`). Điều này giúp LLM ít bị ảo giác (hallucination) hơn rất nhiều.

2. **Deterministic Logic in Code (Logic nằm ở Code):**
   - Thay vì yêu cầu LLM "sắp xếp món ăn phổ biến", tool `getPopularDishes` tự động xử lý logic này bằng truy vấn SQL GroupBy và trả về kết quả đã được sort chuẩn xác.
   - Việc tính toán tổng tiền, xử lý đơn hàng đều nằm ở tầng Service truyền thống.

3. **Từ Wrapper sang Mindset Agentic:**
   - Việc sử dụng `streamText` với `tools` và cấu hình cơ chế loop (`stopWhen: stepCountIs(5)`) chứng tỏ hệ thống đã vượt qua mức ứng dụng chat LLM thông thường để trở thành một Agent có khả năng suy luận và gọi Action.

---

## 🔴 Những lỗ hổng lớn cần phải cải thiện (Gaps & Anti-patterns)

Đây là những điểm mã nguồn hiện tại đang đi ngược lại so với Best Practices.

### 1. Kiến trúc ReAct tự do thay vì Graph-Based Pipeline

- **Hiện trạng:** Hệ thống đang hoạt động như một Single Agent sử dụng mẫu thiết kế ReAct tự do do Vercel AI SDK cung cấp với giới hạn cấu hình `maxSteps: 5`.
- **Vấn đề:** Điều này tạo ra một "hộp đen". LLM tự động quyết định gọi tool nào, lúc nào trả lời. Điều này đi ngược lại với Best Practice **"Ditch the Free-Roam LLM"**.
- **Cách cải thiện:** Cần chuyển đổi sang Multi-Agent/Graph-Based sử dụng các thư viện như `LangGraph` (hoặc tự code State Machine), chia nhỏ thành Supervisor -> Sales Sub-Agent -> Order Sub-Agent để kiểm soát luồng chạy thay vì giao phó toàn bộ sinh mạng vào LLM.

### 2. Thiếu kiến trúc Multi-Agent

- **Hiện trạng:** Toàn bộ công cụ (từ tìm kiếm menu, quản lý đơn hàng đến kiểm tra coupon) đều bị ném chung vào một Prompt tổng khổng lồ `createAiTools()`.
- **Vấn đề:** Khi số lượng tools tăng lên, Context của LLM sẽ bị quá tải, dẫn đến LLM bị rối và chọn nhầm tool.
- **Cách cải thiện:** Chia tách tools cho các Sub-Agent riêng biệt. Supervisor chỉ nhận nhiệm vụ Routing.

### 3. Hạn chế của hệ thống Memory (Conversational Memory)

- **Hiện trạng:** Code đang dùng Sliding Window (giữ lại 20 tin nhắn gần nhất).
- **Vấn đề:** Vi phạm Best Practice về Memory 3 tầng. Sau 20 tin nhắn, Agent sẽ quên sạch thông tin ban đầu.
- **Cách cải thiện:**
  - Áp dụng **Progressive Summary** (Tóm tắt các tin nhắn cũ vứt khỏi window).
  - Áp dụng **Entity Memory** (Lưu lại thông tin như: khách này bị dị ứng đậu phộng lên Redis để luôn gắn vào System Prompt ở mọi vòng lặp).

### 4. RAG còn quá sơ khai (Basic vs Advanced RAG)

- **Hiện trạng:** `searchMenuSemantic` chỉ đơn giản tìm vector. Nếu query thất bại, gọi SQL fallback (`searchMenu`).
- **Vấn đề:**
  - Không có **Query Expansion**: Nếu user dùng từ địa phương, RAG sẽ trượt.
  - Không có **Hybrid Search / Reranking**: Điểm yếu chí mạng vì vector search rất tệ trong việc tìm chính xác tên riêng (Exact Match).
- **Cách cải thiện:** Cần mở rộng câu query trước khi ném vào ChromaDB, và thực hiện Rerank lại kết quả trước khi đưa cho LLM. Tạm thời không cần CRAG vội nhưng Hybrid Search là bắt buộc cho E-commerce.

### 5. Multi-Intent và Cảnh giới Fallback chưa có

- Vẫn phụ thuộc vào LLM tự chạy song song các tool nếu user yêu cầu 2 tác vụ. Không có code cứng bảo vệ (Ví dụ: phải fetch giá thành công mới được add vào giỏ).
- Chưa có cấu trúc chặn tính năng (Ví dụ: bắt buộc văng ra json `unsupportedReason` khi user yêu cầu tính năng ngoài luồng).

---

## 💡 Đề xuất hành động tiếp theo (Next Actions)

Nếu bạn muốn nâng cấp hệ thống này, mình khuyên nên làm theo thứ tự ưu tiên sau:

1. **(Medium Effort / High Impact): Tái cấu trúc RAG:** Thêm Hybrid Search (kết hợp SQL like/FTS với ChromaDB) và tự code một bộ Rerank nhẹ bằng code thuần để xếp điểm.
2. **(High Effort / Highest Impact): Chuyển đổi sang Graph-Based / Multi-Agent:** Đập bỏ kiến trúc Single Agent hiện tại. Implement `LangGraph` (hoặc một phiên bản Node-router đơn giản tự viết) để chia luồng Router -> Search Agent -> Order Agent.
3. **(Low Effort / High Impact): State Memory:** Trích xuất các sự thật tĩnh (User Info, Allergies) thành state và tiêm vào System Prompt thay vì chỉ dùng Sliding Window.
