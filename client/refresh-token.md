# Refresh token trong Next.js

Các API yêu cầu Authentication có thể được gọi ở 2 nơi

1. Server Component: Ví dụ page `/account/me` cần gọi API `/me` ở server component để lấy thông tin profile của user
2. Client Component: Ví dụ page `/account/me` cần gọi API `/me` ở client component để lấy thông tin profile của user

=> Hết hạn token có thể xảy ra ở Server Component và Client Component

Các trường hợp hết hạn access token

- Đang dùng thì hết hạn: Chúng ta sẽ không để trường hợp này xảy ra, bằng cách có 1 setinterval check token liên tục để refresh token trước khi nó hết hạn

- Lâu ngày không vào web, vào lại thì hết hạn:

Khi vào lại website thì middleware.ts sẽ được gọi đầu tiên. Chúng ta sẽ kiểm tra xem access token còn không (vì access token sẽ bị xóa khi hết hạn), nếu không còn thì chúng ta sẽ gọi cho redirect về page client component có nhiệm vụ gọi API refresh token và redirect ngược về trang cũ

Lưu ý để tránh bị bug khi thực hiện Đang dùng thì hết hạn

- Không để refresh token bị gọi duplicate
- Khi refresh token bị lỗi ở route handler => trả về 401 bất kể lỗi gì
- Khi refrest token bị lỗi ở useEffect client => ngừng interval ngay
- Đưa logic check vào layout ở trang authenticated: Không cho chạy refresh token ở những trang mà unauthenticated như: login, logout
- Kiểm tra logic flow trong middleware
