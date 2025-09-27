export default function About() {
  return (
    <div className='flex flex-col'>
      <section className='bg-secondary  py-20 px-4 md:px-6 lg:px-8'>
        <div className='max-w-4xl text-center'>
          <h1 className='text-4xl font-bold sm:text-5xl md:text-6xl'>
            Về nhà hàng Big Boy
          </h1>
          <p className='mt-4 text-lg md:text-xl'>
            Địa chỉ: Số 1, đường Nguyễn Văn Linh, thành phố Đà Nẵng
          </p>
        </div>
      </section>
      <section className='py-12 md:py-20 lg:py-24'>
        <div className='max-w-4xl space-y-8'>
          <div>
            <h2 className='text-3xl font-bold'>Câu chuyện của chúng tôi</h2>
            <p className='mt-4 text-muted-foreground leading-8'>
              Big Boy được thành lập vào năm 2010 với một sứ mệnh đơn giản: phục
              vụ món ăn ngon, chất lượng cao để gắn kết mọi người lại với nhau.
              Niềm đam mê của chúng tôi đối với nguyên liệu đặc biệt và công
              thức sáng tạo đã đưa chúng tôi trở thành một tổ chức địa phương
              được yêu thích, nổi tiếng với cam kết tạo ra những bữa ăn nuôi
              dưỡng cơ thể và tâm hồn.
            </p>
          </div>
          <div>
            <h2 className='text-3xl font-bold'>Giá trị của chúng tôi</h2>
            <p className='mt-4 text-muted-foreground leading-8'>
              Tại trung tâm của Big Boy là sự cống hiến sâu sắc cho tính bền
              vững, cộng đồng và sự xuất sắc trong ẩm thực. Chúng tôi lấy nguyên
              liệu từ các nông dân và nhà sản xuất địa phương, đảm bảo sự tươi
              mới và hỗ trợ nền kinh tế địa phương. Đội ngũ của chúng tôi đam mê
              tạo ra những món ăn không chỉ làm hài lòng vị giác mà còn nuôi
              dưỡng cơ thể, với sự tập trung vào thực phẩm lành mạnh, không qua
              chế biến.
            </p>
          </div>
          <div>
            <h2 className='text-3xl font-bold'>Cam kết của chúng tôi</h2>
            <p className='mt-4 text-muted-foreground leading-8'>
              Chúng tôi tin rằng món ăn ngon có sức mạnh gắn kết mọi người lại
              với nhau và tạo ra những kỷ niệm lâu dài. Đó là lý do tại sao
              chúng tôi cam kết cung cấp một trải nghiệm ẩm thực tuyệt vời, từ
              lúc bạn bước qua cửa cho đến miếng cuối cùng của bữa ăn. Các đầu
              bếp tài năng của chúng tôi làm việc không ngừng để tạo ra những
              món ăn thể hiện tốt nhất các nguyên liệu theo mùa, được lấy từ địa
              phương, đảm bảo rằng mỗi đĩa ăn là một lễ kỷ niệm của hương vị và
              chất lượng.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
