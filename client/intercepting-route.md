# Intercepting Route

- Parallel Route (Route song song): Render component (`page.tsx` hoặc `default.tsx`) cùng với route hiện tại
- Intercepting Route (Route chặn): Khi navigate, thay vì render `page.tsx` đích đến, nó sẽ render `page.tsx` ở route chặn. Điều này không xảy ra khi full page load

## Cách hoạt động

Khai báo tên folder theo `(.), (....), (...)` (Tham khảo doc)

`..` là dựa vào route segment chứ không dựa vào folder path

Khai báo intercepting route ở đâu thì những page ở level đó và con của nó sẽ bị chặn (là chủ đích hay bug của next? vì không thấy doc có đề cập)
