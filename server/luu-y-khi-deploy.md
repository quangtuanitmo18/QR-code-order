# Những lưu ý khi deploy BackEnd

## Không deploy lên render.com được

render.com không cho phép sqllite cũng như upload ảnh ở plan free => recommend deploy trên vps cá nhân (có hướng dẫn ở blog duthanhduoc.com)

## Deploy lên VPS

Khi deploy lên VPS thì không đẩy file database (`/server/prisma/dev.db`) và folder `uploads` lên VPS.

Vì database ở local của các bạn nó khác database trên VPS (môi trường production).

ví dụ: Khi bạn upload ảnh ở local thì đường link ảnh là `http://localhost:4000/static/anh.jpg` và url này sẽ được lưu trong `dev.db`. Nếu các bạn dùng file `dev.db` này ở VPS thì kết quả API trả về khi gọi các api có chứa ảnh là `http://localhost:4000/static/anh.jpg`. Rõ ràng url này không dùng được, kết quả đúng phải là `http://yourdomain.com/static/anh.jpg`.

Ở vps, khi các bạn clone project backend về rồi, để khởi tạo database ngay lần đầu tiên thì các bạn chạy câu lệnh prisma sau.

Nhớ `cd` vào trong thư mục server

```bash
npx prisma db push
```

## Mình đã deploy 1 API backend để hỗ trợ các bạn test deploy front-end

Để deploy next.js frontend lên Vercel, chúng ta vercel truy cập được vào api backend trong quá trình build. Nếu không deploy backend thì các bạn không thể deploy frontend lên vercel được.

Vì thế mình đã deploy 1 API backend phục vụ cho việc test deploy frontend.

API backend: [https://api-bigboy.duthanhduoc.com](https://api-bigboy.duthanhduoc.com)

Vì API sẽ dùng cho tất cả học viên khóa học nên sẽ có các giới hạn nhằm bảo vệ database:

- Các bạn chỉ có thể đăng nhập vào GET các thông tin
- Không thể thay đổi thêm sửa xóa info như: dishes, accounts, orders,...

## Đưa dự án vào CV như thế nào?

1. Để hoàn thiện dự án thì các bạn cần phải deploy lên production, cái này mình khuyên các bạn nên tự deploy backend và frontend lên VPS cá nhân.

2. Trong trường hợp các bạn không biết deploy lên VPS thì:

- Sắp tới mình cũng có 1 khóa học về **Deploy website react,node,next lên VPS**. Các bạn có thể xem tại trang [https://edu.duthanhduoc.com/](https://edu.duthanhduoc.com/)

- Hoặc các bạn quay video giới thiệu dự án trên môi trường localhost và đưa cái link video đó vào CV là được.
