# Đa ngôn ngữ trong Next.js

Rộng hơn đa ngôn ngữ thì chúng ta có "Quốc tế hóa": đa ngôn ngữ, đa múi giờ, đa định dạng số,...

Quốc tế hóa = Internationalization = i18n (18 là số lượng ký tự giữa i và n)

Khi làm 1 website đa ngôn ngữ thì phải có sự phối hợp giữa Frontend và Backend.

FrontEnd xử lý text cố định, Backend xử lý nội dụng API

Trong Next.js thì có 2 cách làm đa ngôn ngữ

- i18n Routing: Mỗi ngôn ngữ sẽ có 1 route riêng. Ví dụ `duthanhduoc.com/en`, `duthanhduoc.com/vi`, hoặc `en.duthanhduoc.com`, `vi.duthanhduoc.com`
- i18n không Routing: Mỗi ngôn ngữ sẽ không có route riêng, mà sẽ dựa vào ngôn ngữ hiện tại để hiển thị nội dung tương ứng.

i18n Routing sẽ tốt hơn cho SEO, vì sẽ có mỗi version website riêng cho từng quốc gia.

i18n không Routing sẽ dễ làm hơn, nếu website bạn chỉ phục vụ trong quốc gia bạn thì nên làm cái này.
