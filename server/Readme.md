# Giới thiệu về API

Đây là backend API cho dự án Order món ă

- Authentication: Login, Register, Logout
- Account: Get thông tin cá nhân, Cập nhật thông tin cá nhân
- Dish: Đọc, Thêm, Sửa, Xóa món ăn
- Media: Upload hình ảnh
- Test API

> Lưu ý quan trọng: thỉnh thoảng nên pull code mới từ github repo của mình về, vì đôi khi mình có cập nhật logic API trong quá trình mình quay video

> Trong file `server/.env` có thuộc tính `COOKIE_MODE`, hãy set `true` nếu bạn muốn dùng cookie cho việc authentication ở server

## Công nghệ sử dụng

Node.js + Fastify + Sqlite

## Cài đặt

Chỉ cần clone repository này về máy, cd vào thư mục, cài đặt các packages và chạy lệnh `npm run dev` là được

```bash
cd server
npm i
npm run dev
```

Trong trường hợp muốn chạy dishion, chạy lệnh

```bash
npm run build
npm run start
```

Muốn xem thông tin database, chỉ cần mở Prisma Studio lên bằng câu lệnh

```bash
npx prisma studio
```

Nó sẽ chạy ở url [http://localhost:5555](http://localhost:5555)

Trong source code có chứa file `.env` để config, trong file này bạn có thể đổi port cho API backend, mặc định là port `4000`

Khi upload thì hình ảnh sẽ được đi vào thư mục `/uploads` trong folder `server`

## Format response trả về

Định dạng trả về là JSON, và luôn có trường `message`, ngoài ra có thể sẽ có trường `data` hoặc `errors`

Đây là ví dụ về response trả về khi thành công

```json
{
  "data": {
    "id": 2,
    "name": "Iphone 11",
    "price": 20000000,
    "description": "Mô tả cho iphone 11",
    "image": "http://localhost:4000/static/bec024f9ea534b7fbf078cb5462b30aa.jpg",
    "createdAt": "2024-03-11T03:51:14.028Z",
    "updatedAt": "2024-03-11T03:51:14.028Z"
  },
  "message": "Tạo sản phẩm thành công!"
}
```

Trong trường hợp lỗi thì nếu lỗi liên quan đến việc body gửi lên không đúng định dạng thì server sẽ trả về lỗi `422` và thông tin lỗi như sau

Ví dụ dưới đây body thiếu trường `price`

```json
{
  "message": "A validation error occurred when validating the body...",
  "errors": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "undefined",
      "path": ["price"],
      "message": "Required",
      "field": "price"
    }
  ],
  "code": "FST_ERR_VALIDATION",
  "statusCode": 422
}
```

Trong trường hợp lỗi khác, server sẽ trả về lỗi trong trường `message`, ví dụ

```json
{
  "message": "Không tìm thấy dữ liệu!",
  "statusCode": 404
}
```

## Chi tiết các API

Mặc định API sẽ chạy ở địa chỉ [http://localhost:4000](http://localhost:4000), các bạn nào muốn đổi port thì vào file `.env` để thay đổi port

Với các API POST, PUT thông thường thì body gửi lên phải là JSON, và phải có header `Content-Type: application/json`.

Đặc biệt API upload hình ảnh thì phải gửi dưới dạng `form-data`

API xác thực người dùng thông qua session token, session token này là một JWT, secret key JWT này sẽ được lưu trong file `.env` và được sử dụng để tạo và verify token

Đối với các API cần xác thực người dùng như bên cụm API về `Account` thì bạn cần gửi accessToken lên server thông qua header `Authorization: "Bearer <accessToken>"`

### Test API: muốn biết api có hoạt động không

- `GET /test`: Trả về message nghĩa là API hoạt động

### Các API cần realtime

- `POST /guest/orders`: Tạo order mới

## Setup nhanh postman

> Hiện tại thì chưa có file collection Postman, khi nào mình quay xong khóa học mình sẽ update lên nhé

Mình có lưu 1 file là `NextJs Free API.postman_collection.json` trong thư mục `server`, các bạn chỉ cần import file này vào Postman là có ngay collection của mình. Tiếp theo các bạn tạo 1 environment mới, và set biến `host` là `http://localhost:4000`, và chọn environment này khi gọi API là xong.

## Tài khoản mặc định

Tài khoản admin: admin@order.com | 123456
Tài khoản user:

- phuminhdat@gmail.com | 123123
- buianhson@gmail.com | 123123
- ngocbichhuynh@gmail.com | 123123
- binhnguyen@gmail.com | 123123
