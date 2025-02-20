# Parallel Route

Tạo name folder với `@` phía trước thì ta gọi folder đó là slot: `@settings`, `@modal`,...

Slot thì không tạo ra route segment, khá giống với route group (`()`)

Ví dụ tạo file với đường dẫn `app/@modal/page.tsx` thì route segment là `/` chứ không phải là `/modal`

## Làm sao để slot hoạt động (active state)?

Muốn slot active phải đảm bảo

- URL phải khớp với route slot

- Slot phải được dùng trong `layout.tsx`

Khi active thì slot sẽ render file `page.tsx` trong slot.

Trong trường hợp không active thì slot sẽ render file `default.tsx` trong slot, nếu không có file này thì sẽ render 404 page. Vậy nên thường để tránh 404 page thì ngta thường return null trong file `default.tsx`

### Vẫn sẽ có trường hợp URL không khớp với route slot nhưng slot vẫn active

Đó là khi slot đã được active từ trước, sau đó bạn navigate đến 1 page khác thì slot vẫn còn ở đó do dùng chung layout.

Với trường hợp này, khi full page reload (F5) thì slot sẽ không active nữa, lúc này sẽ render file `default.tsx` trong slot.

## Hãy cẩn thận với việc khai báo folder khác trong 1 slot

Ví dụ bạn tạo file `app/@modal/setting/page.tsx` thì lúc này bạn sẽ có 2 slot chung 1 cái tên là `modal`

- Slot 1: `app/@modal/page.tsx` (cái này chúng ta chưa tạo)
- Slot 2: `app/@modal/setting/page.tsx`

Vì 2 slot dùng chung 1 cái tên nên nên 1 lúc chỉ có 1 slot được hiển thị thôi.

Và bạn sẽ có 1 route segment mới là `/setting`

Bây giờ mình sẽ làm một số bài test:

1. Khi bạn **enter** vào `/` thì bạn sẽ bị 404. Lý do là bởi vì slot `modal` 1 sẽ kích hoạt do trùng url nhưng chúng ta chưa tạo file `page.tsx` trong slot này.

2. Khi bạn từ trang chủ **click** vào `/setting` thì slot `modal` 2 sẽ được active, cùng với đó là slot `children` ẩn được active.

Nhưng bạn F5 page `/setting` thì bạn sẽ bị 404. Vì lúc này slot `chidren` không active nữa, Next.js sẽ tìm đến `default.tsx` của slot children nhưng chúng ta chưa tạo thì sẽ bị 404.

> Bạn chỉ cần quan tâm slot ẩn `children` khi bạn đang ở url `/setting` thôi, còn lại url khác thì không cần quan tâm.
