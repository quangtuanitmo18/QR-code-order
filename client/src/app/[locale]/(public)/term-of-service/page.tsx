export default function TermsOfService() {
  return (
    <div className="flex flex-col">
      <section className="bg-secondary py-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
            Terms of Service
          </h1>
        </div>
      </section>
      <section className="py-12 md:py-20 lg:py-24">
        <div className="max-w-4xl space-y-8">
          <div>
            <h2 className="text-3xl font-bold">Introduction</h2>
            <p className="mt-4 text-muted-foreground leading-8">
              Welcome to our Terms of Service page. By using our services, you
              agree to comply with the terms and conditions outlined below.
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Use of Service</h2>
            <p className="text-muted-foreground leading-8">
              You agree to use our services only for lawful purposes and not to
              violate any laws. You may not use our services to disseminate
              illegal content, cause harm, or infringe upon the privacy rights
              of others.
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Intellectual Property</h2>
            <p className="text-muted-foreground leading-8">
              All content and materials on our website, including text, images,
              graphics, logos, and software, are the property of us or our
              licensors and are protected by intellectual property laws.
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Changes to Terms</h2>
            <p className="text-muted-foreground leading-8">
              We reserve the right to change these terms of service at any time
              without prior notice. Your continued use of our services after any
              changes are posted will constitute your acceptance of those
              changes.
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Contact</h2>
            <p className="text-muted-foreground leading-8">
              If you have any questions regarding these terms of service, please
              contact us via the email or phone number provided on our website.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
