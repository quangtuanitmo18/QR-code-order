export default function TermsOfService() {
  return (
    <div className='flex flex-col'>
      <section className='bg-secondary py-20 px-4 md:px-6 lg:px-8'>
        <div className='max-w-4xl text-center'>
          <h1 className='text-4xl font-bold sm:text-5xl md:text-6xl'>
            Điều khoản dịch vụ
          </h1>
        </div>
      </section>
      <section className='py-12 md:py-20 lg:py-24'>
        <div className='max-w-4xl space-y-8'>
          <div>
            <h2 className='text-3xl font-bold'>Giới thiệu</h2>
            <p className='mt-4 text-muted-foreground leading-8'>
              Chào mừng bạn đến với trang Điều khoản dịch vụ của chúng tôi. Khi
              sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản
              và điều kiện dưới đây.
            </p>
          </div>
          <div className='space-y-4'>
            <h2 className='text-3xl font-bold'>Sử dụng dịch vụ</h2>
            <p className='text-muted-foreground leading-8'>
              Bạn đồng ý sử dụng dịch vụ của chúng tôi chỉ cho các mục đích hợp
              pháp và không vi phạm bất kỳ luật lệ nào. Bạn không được sử dụng
              dịch vụ của chúng tôi để phát tán nội dung bất hợp pháp, gây hại
              hoặc vi phạm quyền riêng tư của người khác.
            </p>
          </div>
          <div className='space-y-4'>
            <h2 className='text-3xl font-bold'>Quyền sở hữu trí tuệ</h2>
            <p className='text-muted-foreground leading-8'>
              Tất cả nội dung và tài liệu trên trang web của chúng tôi, bao gồm
              văn bản, hình ảnh, đồ họa, logo, và phần mềm, đều thuộc quyền sở
              hữu của chúng tôi hoặc các bên cấp phép của chúng tôi và được bảo
              vệ bởi luật sở hữu trí tuệ.
            </p>
          </div>
          <div className='space-y-4'>
            <h2 className='text-3xl font-bold'>Thay đổi điều khoản</h2>
            <p className='text-muted-foreground leading-8'>
              Chúng tôi có quyền thay đổi các điều khoản dịch vụ này bất kỳ lúc
              nào mà không cần thông báo trước. Việc tiếp tục sử dụng dịch vụ
              của bạn sau khi các thay đổi được đăng tải sẽ được coi là sự chấp
              nhận của bạn đối với các thay đổi đó.
            </p>
          </div>
          <div className='space-y-4'>
            <h2 className='text-3xl font-bold'>Liên hệ</h2>
            <p className='text-muted-foreground leading-8'>
              Nếu bạn có bất kỳ câu hỏi nào về các điều khoản dịch vụ này, vui
              lòng liên hệ với chúng tôi qua email hoặc số điện thoại được cung
              cấp trên trang web của chúng tôi.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
