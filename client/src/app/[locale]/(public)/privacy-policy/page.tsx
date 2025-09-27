export default function About() {
  return (
    <div className='flex flex-col'>
      <section className='bg-secondary  py-20 px-4 md:px-6 lg:px-8'>
        <div className='max-w-4xl text-center'>
          <h1 className='text-4xl font-bold sm:text-5xl md:text-6xl'>
            Chính sách bảo mật
          </h1>
        </div>
      </section>
      <section className='py-12 md:py-20 lg:py-24'>
        <div className='max-w-4xl space-y-8'>
          <div>
            <h2 className='text-3xl font-bold'>Dữ liệu thu thập</h2>
            <p className='mt-4 text-muted-foreground leading-8'>
              Chúng tôi thu thập các thông tin cá nhân mà bạn cung cấp khi tạo
              tài khoản, đặt hàng hoặc liên hệ với chúng tôi. Các thông tin này
              có thể bao gồm tên. Ngoài ra, chúng tôi cũng thu thập một số thông
              tin tự động khi bạn truy cập trang web của chúng tôi, như địa chỉ
              IP và loại trình duyệt.
            </p>
          </div>
          <div className='space-y-4'>
            <h2 className='text-3xl font-bold'>Mục đích sử dụng</h2>
            <p className=' text-muted-foreground leading-8'>
              Chúng tôi sử dụng thông tin cá nhân của bạn với các mục đích sau:
            </p>
            <ul className='space-y-4 text-muted-foreground leading-8'>
              <li>
                Để xử lý đơn hàng của bạn: Chúng tôi sử dụng thông tin liên hệ
                và thanh toán của bạn để xác nhận và xử lý đơn hàng, cũng như để
                gửi hóa đơn và thông tin giao hàng.
              </li>
              <li>
                Để cung cấp dịch vụ khách hàng: Chúng tôi sử dụng thông tin liên
                hệ của bạn để trả lời các câu hỏi, giải quyết các vấn đề và cung
                cấp hỗ trợ kỹ thuật.
              </li>
              <li>
                Để gửi các thông tin tiếp thị: Với sự đồng ý của bạn, chúng tôi
                có thể sử dụng địa chỉ email của bạn để gửi các thông tin về các
                sản phẩm, dịch vụ mới, khuyến mãi và sự kiện đặc biệt.
              </li>
              <li>
                Để cải thiện dịch vụ của chúng tôi: Chúng tôi sử dụng dữ liệu
                tổng hợp và ẩn danh để phân tích xu hướng và cải thiện dịch vụ
                của chúng tôi.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
