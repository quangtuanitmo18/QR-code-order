export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(70%_70%_at_50%_-10%,hsl(var(--secondary))/0.6,transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Terms of Service
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Please read these terms carefully before using our services.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-4 pb-16 md:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-8">
          {/* Card: Introduction */}
          <article className="rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 md:p-8">
            <header className="flex items-center gap-3">
              <IconDocument className="h-6 w-6" />
              <h2 className="text-2xl font-semibold md:text-3xl">
                Introduction
              </h2>
            </header>
            <p className="mt-4 leading-8 text-muted-foreground">
              Welcome to our Terms of Service. By accessing or using our website
              and services, you agree to be bound by these terms.
            </p>
          </article>

          {/* Card: Use of Services */}
          <article className="rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 md:p-8">
            <header className="flex items-center gap-3">
              <IconShield className="h-6 w-6" />
              <h2 className="text-2xl font-semibold md:text-3xl">
                Use of Services
              </h2>
            </header>
            <p className="mt-4 leading-8 text-muted-foreground">
              You agree to use our services only for lawful purposes and not to
              distribute unlawful or harmful content or infringe others'
              privacy.
            </p>
            <ul className="mt-4 space-y-3 leading-8 text-muted-foreground">
              <li className="flex items-start gap-3">
                <IconCheck className="mt-1 h-5 w-5 flex-none" />
                <span>No attempts to disrupt or overload the service.</span>
              </li>
              <li className="flex items-start gap-3">
                <IconCheck className="mt-1 h-5 w-5 flex-none" />
                <span>Compliance with applicable laws and regulations.</span>
              </li>
              <li className="flex items-start gap-3">
                <IconCheck className="mt-1 h-5 w-5 flex-none" />
                <span>Respect for others' rights and data.</span>
              </li>
            </ul>
          </article>

          {/* Card: Intellectual Property */}
          <article className="rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 md:p-8">
            <header className="flex items-center gap-3">
              <IconGavel className="h-6 w-6" />
              <h2 className="text-2xl font-semibold md:text-3xl">
                Intellectual Property
              </h2>
            </header>
            <p className="mt-4 leading-8 text-muted-foreground">
              All content on our website—including text, images, graphics,
              logos, and software—is owned by us or our licensors and is
              protected by intellectual property laws.
            </p>
          </article>

          {/* Card: Changes to the Terms */}
          <article className="rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 md:p-8">
            <header className="flex items-center gap-3">
              <IconTarget className="h-6 w-6" />
              <h2 className="text-2xl font-semibold md:text-3xl">
                Changes to the Terms
              </h2>
            </header>
            <p className="mt-4 leading-8 text-muted-foreground">
              We may update these Terms from time to time. Your continued use of
              the services after changes are posted constitutes acceptance of
              the updated terms.
            </p>
          </article>

          {/* Card: Contact */}
          <article className="rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 md:p-8">
            <header className="flex items-center gap-3">
              <IconTarget className="h-6 w-6" />
              <h2 className="text-2xl font-semibold md:text-3xl">Contact</h2>
            </header>
            <p className="mt-4 leading-8 text-muted-foreground">
              If you have any questions about these Terms of Service, please
              contact us via the email address or phone number provided on our
              website.
            </p>
          </article>

          {/* Meta */}
          {/* <div className="rounded-2xl border bg-muted/40 p-6 md:p-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <p className="text-sm text-muted-foreground">
                Last updated:{" "}
                <time dateTime="2025-09-28">September 28, 2025</time>
              </p>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:shadow md:text-base"
              >
                Contact us
              </a>
            </div>
          </div> */}
        </div>
      </section>
    </div>
  );
}
function IconDocument(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}
function IconShield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 22s8-4 8-10V6l-8-4-8 4v6c0 6 8 10 8 10Z" />
    </svg>
  );
}
function IconGavel(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M14 13l6 6" />
      <path d="M8 7l6 6" />
      <path d="M2 22h7" />
      <path d="M9 7l4-4 4 4-4 4z" />
    </svg>
  );
}
function IconTarget(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M22 12h-2" />
      <path d="M6 12H2" />
      <path d="M12 6V2" />
      <path d="M12 22v-2" />
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}
function IconMail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}
