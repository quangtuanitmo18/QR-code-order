export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(70%_70%_at_50%_-10%,hsl(var(--secondary))/0.6,transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Privacy Policy
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Learn how we collect, use, and protect your information, and how
              it may be shared with third parties.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-4 pb-16 md:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-8">
          {/* Card: Data We Collect */}
          <article className="rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 md:p-8">
            <header className="flex items-center gap-3">
              <IconShield className="h-6 w-6" />
              <h2 className="text-2xl font-semibold md:text-3xl">
                Data We Collect
              </h2>
            </header>
            <p className="mt-4 leading-8 text-muted-foreground">
              We collect personal information you provide when creating an
              account, placing orders, or contacting us. This may include your
              name. We also automatically collect certain information when you
              access our website, such as your IP address and browser type.
            </p>
          </article>

          {/* Card: Purposes of Use */}
          <article className="rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 md:p-8">
            <header className="flex items-center gap-3">
              <IconTarget className="h-6 w-6" />
              <h2 className="text-2xl font-semibold md:text-3xl">
                Purposes of Use
              </h2>
            </header>
            <p className="mt-4 leading-8 text-muted-foreground">
              We use your personal information for the following purposes:
            </p>
            <ul className="mt-4 space-y-4 leading-8 text-muted-foreground">
              <li className="flex items-start gap-3">
                <IconCheck className="mt-1 h-5 w-5 flex-none" />
                <span>
                  <span className="font-medium text-foreground">
                    To process your orders:
                  </span>{" "}
                  We use your contact and payment details to confirm and fulfill
                  orders, and to send invoices and shipping information.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <IconCheck className="mt-1 h-5 w-5 flex-none" />
                <span>
                  <span className="font-medium text-foreground">
                    To provide customer support:
                  </span>{" "}
                  We use your contact information to answer questions, resolve
                  issues, and provide technical support.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <IconCheck className="mt-1 h-5 w-5 flex-none" />
                <span>
                  <span className="font-medium text-foreground">
                    To send marketing communications:
                  </span>{" "}
                  With your consent, we may use your email address to share
                  information about new products, services, promotions, and
                  special events.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <IconCheck className="mt-1 h-5 w-5 flex-none" />
                <span>
                  <span className="font-medium text-foreground">
                    To improve our services:
                  </span>{" "}
                  We use aggregated and anonymized data to analyze trends and
                  enhance our services.
                </span>
              </li>
            </ul>
          </article>

          {/* Meta & Contact */}
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

/* ---- Minimal inline icons (no external deps) ---- */
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
