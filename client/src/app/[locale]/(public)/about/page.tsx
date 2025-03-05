export default function About() {
  return (
    <div className='flex flex-col'>
      <section className='bg-secondary py-20 px-4 md:px-6 lg:px-8'>
        <div className='max-w-4xl text-center'>
          <h1 className='text-4xl font-bold sm:text-5xl md:text-6xl'>About Restaurant</h1>
          <p className='mt-4 text-lg md:text-xl'>Address: No. 1, Nguyen Van Linh Street, Da Nang City</p>
        </div>
      </section>
      <section className='py-12 md:py-20 lg:py-24'>
        <div className='max-w-4xl space-y-8'>
          <div>
            <h2 className='text-3xl font-bold'>Our Story</h2>
            <p className='mt-4 text-muted-foreground leading-8'>
              Big Boy was founded in 2010 with a simple mission: to serve delicious, high-quality food that brings
              people together. Our passion for unique ingredients and creative recipes has turned us into a beloved
              local establishment known for our commitment to creating meals that nourish both body and soul.
            </p>
          </div>
          <div>
            <h2 className='text-3xl font-bold'>Our Values</h2>
            <p className='mt-4 text-muted-foreground leading-8'>
              At the heart of Big Boy is a deep commitment to sustainability, community, and culinary excellence. We
              source our ingredients from local farmers and producers to ensure freshness and support the local economy.
              Our team is passionate about creating dishes that not only delight the palate but also nourish the body,
              with a focus on healthy, unprocessed foods.
            </p>
          </div>
          <div>
            <h2 className='text-3xl font-bold'>Our Commitment</h2>
            <p className='mt-4 text-muted-foreground leading-8'>
              We believe that great food has the power to bring people together and create lasting memories. That is why
              we are committed to providing an exceptional dining experience, from the moment you walk in until the last
              bite of your meal. Our talented chefs work tirelessly to craft dishes that showcase the best of seasonal,
              locally-sourced ingredients, ensuring that every plate is a celebration of flavor and quality.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
