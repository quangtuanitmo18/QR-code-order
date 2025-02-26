export default function About() {
  return (
    <div className="flex flex-col">
      <section className="bg-secondary py-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
            Privacy Policy
          </h1>
        </div>
      </section>
      <section className="py-12 md:py-20 lg:py-24">
        <div className="max-w-4xl space-y-8">
          <div>
            <h2 className="text-3xl font-bold">Data Collection</h2>
            <p className="mt-4 text-muted-foreground leading-8">
              We collect the personal information you provide when creating an
              account, placing an order, or contacting us. This information may
              include your name. Additionally, we also automatically collect
              certain information when you visit our website, such as your IP
              address and browser type.
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Purpose of Use</h2>
            <p className="text-muted-foreground leading-8">
              We use your personal information for the following purposes:
            </p>
            <ul className="space-y-4 text-muted-foreground leading-8">
              <li>
                <strong>To process your orders:</strong> We use your contact and
                payment information to confirm and process your orders, as well
                as to send invoices and delivery details.
              </li>
              <li>
                <strong>To provide customer service:</strong> We use your
                contact information to answer inquiries, resolve issues, and
                provide technical support.
              </li>
              <li>
                <strong>To send marketing information:</strong> With your
                consent, we may use your email address to send information about
                new products, services, promotions, and special events.
              </li>
              <li>
                <strong>To improve our services:</strong> We use aggregated and
                anonymized data to analyze trends and enhance our services.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
