# Stateful and Stateless Authentication

Đây là 2 kiểu xác thực phổ biến nhất, đều dùng token để xác thực. Sự khác biệt giữa chúng là ở chỗ nào?

## Stateful Authentication

Token có thể là 1 chuỗi ngẫu nhiên, 1 chuỗi mã hóa hoặc JWT

Token sẽ được lưu trên server (trong RAM server hoặc trong database) và client.

Mỗi lần client gửi request lên server, server sẽ request vào database để kiểm tra token có hợp lệ không.

## Stateless Authentication

Token thường là JWT (JSON Web Token)

Token không cần lưu ở server, chỉ cần lưu ở client là được.

Mỗi lần client gửi request lên server, server sẽ kiểm tra token có hợp lệ không dựa trên thuật toán mã hóa, không cần request vào database.

## So sánh

| Stateful                                                                                                        | Stateless                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ✅Token ngắn, vì không phải lưu thông tin vào token                                                             | ❌Lưu thông tin vào token nên token thường rất dài, chiếm bộ nhớ                                                                                       |
| ❌Cần dùng thông tin gì về user lại phải request đến db, ở client hay server đều vậy                            | ✅Vì lưu thông tin vào token nên đôi khi ở client không cần request đến server để lấy info, server không cần request db để lấy info                    |
| ❌Khi thêm server service mới, cần xác thực request thì lại phải gọi đến DB để kiểm tra phức tạp, tốn thời gian | ✅Nếu có nhiều server service, bạn cần xác thực 1 request thì chỉ cần validate token, không cần phải request đến db, vậy nên dễ scale theo chiều ngang |
| ✅Revoke token, change role user bất cứ lúc nào, client sẽ có hiệu nghiệm ngay lập tức                          | ❌Vì server không lưu token nên khi không có cách nào revoke token của 1 người, cần phải đợi token đó hết hạn. Khi change role cũng tương tự như vậy   |

## Kết luận

### Sử dụng Stateful Authentication khi:

- **Quản lý quyền hạn chặt chẽ:** Bạn cần có khả năng kiểm soát và thay đổi quyền hạn của người dùng một cách linh hoạt và nhanh chóng.
- **Cần revoke token hoặc thay đổi vai trò người dùng bất cứ lúc nào:** Khi cần có khả năng hủy token hoặc thay đổi vai trò của người dùng ngay lập tức mà không cần chờ đợi token hết hạn.
- **Độ chính xác cao trong quản lý quyền hạn:** Khi hệ thống yêu cầu độ chính xác cao trong việc quản lý quyền hạn và truy cập của người dùng.

### Sử dụng Stateless Authentication khi:

- **Cần scale theo chiều ngang:** Khi hệ thống cần được mở rộng một cách linh hoạt và hiệu quả, stateless authentication cho phép dễ dàng thêm các server mới mà không cần phức tạp trong việc đồng bộ trạng thái.
- **Không yêu cầu quản lý quyền hạn chặt chẽ:** Khi hệ thống không cần quản lý quyền hạn một cách chặt chẽ, việc sử dụng stateless authentication giúp giảm thiểu độ phức tạp và tăng hiệu suất.
- **Đơn giản hóa quy trình xác thực:** Stateless authentication cho phép xác thực mà không cần liên tục truy vấn cơ sở dữ liệu để kiểm tra thông tin người dùng, giảm thiểu độ trễ và tăng tốc độ xử lý.

Tóm lại, lựa chọn giữa stateful và stateless authentication phụ thuộc vào yêu cầu cụ thể của hệ thống bạn đang xây dựng, bao gồm yêu cầu về quản lý quyền hạn, khả năng mở rộng và hiệu suất.
