# Sự khác nhau giữa Role Based Access Control và Permission Based Access Control

## Access Control

Access Control là kiểm soát quyền truy cập. Có 2 kiểu phổ biến là

- Role Based Access Control (RBAC): kiểm soát quyền truy cập dựa trên vai trò của người dùng.
- Permission Based Access Control (PBAC): kiểm soát quyền truy cập dựa trên quyền trên từng chức năng của người dùng.

## Role Based Access Control (RBAC)

Hệ thống quản lý quán ăn sẽ có 3 role chính:

- Admin: có quyền thao tác mọi chức năng trên hệ thống
- Employee: có quyền thao tác một số chức năng như tạo order, xem order nhưng không thể quản lý nhân viên khác
- Guest: chỉ có quyền xem menu, tạo order

Các quyền hạn ở mỗi role thường được định nghĩa cố định khi code.

Tất nhiên bạn cũng có thể code 1 hệ thống thay đổi quyền hạn trên mỗi role 1 cách linh hoạt hơn. Lưu ý là thay đổi quyền hạn trên mỗi role chứ không phải trên mỗi tài khoản.

Mỗi account sẽ được gán với 1 role trên.

## Permission Based Access Control (PBAC)

Thay vì chia theo role thì hệ thống sẽ chia theo từng quyền hạn cụ thể.

Ví dụ khi tạo tài khoản, bạn sẽ được gán vài quyền hạn cơ bản như: READ_PROFILE, WRITE_PROFILE, READ_ORDER, WRITE_ORDER

Khi cần thêm quyền hạn mới, admin sẽ thêm quyền hạn đó cho tài khoản cụ thể.

Đây vừa là ưu điểm vừa là nhược điểm:

- Nó linh hoạt hơn RBAC vì có thể thêm quyền hạn mới mà không cần phải tạo role mới
- Nhưng cũng khó kiểm các tài khoản nếu có quá nhiều quyền hạn, có quá nhiều tài khoản
