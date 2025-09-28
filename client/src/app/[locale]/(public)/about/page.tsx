// =====================
// About Page (Polished, drop-in replacement)
// =====================
export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(70%_70%_at_50%_-10%,hsl(var(--secondary))/0.6,transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              About Big Boy Restaurant
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Address: No. 1, Nguyen Van Linh Street, Da Nang City
            </p>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Founded" value="2010" />
          <StatCard label="Dishes Served" value="1M+" />
          <StatCard label="Local Partners" value="35+" />
          <StatCard label="Team Members" value="50+" />
        </div>
      </section>

      {/* Content blocks */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 lg:px-8 md:py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          {/* Narrative */}
          <div className="mx-auto grid max-w-3xl gap-8">
            <ArticleCard icon={IconHeart} title="Our Story">
              Founded in 2010, Big Boy has a simple mission: to serve delicious,
              high-quality food that brings people together. Our passion for
              exceptional ingredients and creative recipes has made us a beloved
              local establishment, known for our commitment to crafting meals
              that nourish both body and soul.
            </ArticleCard>

            <ArticleCard icon={IconLeaf} title="Our Values">
              At the heart of Big Boy is a deep dedication to sustainability,
              community, and culinary excellence. We source ingredients from
              local farmers and producers to ensure freshness while supporting
              the local economy. Our team is passionate about creating dishes
              that not only delight the palate but also nourish the body, with a
              focus on wholesome, minimally processed foods.
            </ArticleCard>

            <ArticleCard icon={IconStar} title="Our Commitment">
              We believe great food has the power to bring people together and
              create lasting memories. That’s why we’re committed to delivering
              an exceptional dining experience—from the moment you walk through
              our doors to the last bite. Our talented chefs work tirelessly to
              showcase the best of seasonal, locally sourced ingredients,
              ensuring every plate is a celebration of flavor and quality.
            </ArticleCard>

            {/* Callout */}
            {/* <div className="rounded-2xl border bg-muted/40 p-6 md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Visiting Da Nang? Book a table and taste the season.
                </p>
                <div className="flex gap-3">
                  <a
                    href="/menu"
                    className="inline-flex items-center justify-center rounded-xl border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:shadow"
                  >
                    View Menu
                  </a>
                  <a
                    href="/reservation"
                    className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition hover:shadow"
                  >
                    Reserve Now
                  </a>
                </div>
              </div>
            </div> */}
          </div>

          {/* Media / Gallery */}
          <div className="grid gap-4 sm:grid-cols-2">
            <GalleryTile caption="Seasonal bowls" />
            <GalleryTile caption="Local greens" />
            <GalleryTile caption="Open kitchen" />
            <GalleryTile caption="Neighborhood vibes" />
          </div>
        </div>
      </section>

      {/* Footer meta */}
      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6 lg:px-8">
        <div className="rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 md:p-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <address className="not-italic text-sm text-muted-foreground">
              No. 1 Nguyen Van Linh, Hai Chau District, Da Nang City, Vietnam
            </address>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="tel:+84123456789"
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm transition hover:shadow"
              >
                <IconPhone className="h-4 w-4" /> +84 123 456 789
              </a>
              <a
                href="mailto:hello@bigboy.vn"
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm transition hover:shadow"
              >
                <IconMail className="h-4 w-4" /> hello@bigboy.vn
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* --- UI Building Blocks --- */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card/60 p-5 text-center shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="text-2xl font-bold md:text-3xl">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function ArticleCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 md:p-8">
      <header className="flex items-center gap-3">
        <Icon className="h-6 w-6" />
        <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
      </header>
      <div className="mt-4 leading-8 text-muted-foreground">{children}</div>
    </article>
  );
}

function GalleryTile({ caption }: { caption: string }) {
  return (
    <figure className="group relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted/40">
      {/* Decorative placeholder - replace with next/image or img src when available */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 transition-transform duration-300 group-hover:scale-105" />
      <figcaption className="absolute inset-x-0 bottom-0 m-3 rounded-xl bg-background/70 px-3 py-1 text-xs shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70">
        {caption}
      </figcaption>
    </figure>
  );
}

/* --- Minimal inline icons --- */
function IconHeart(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M20.8 8.6A5.4 5.4 0 0 0 12 7.3a5.4 5.4 0 1 0-8.8 6.3L12 21l8.8-7.4a5.4 5.4 0 0 0 0-5Z" />
    </svg>
  );
}
function IconLeaf(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M11 21C4 21 3 14 3 14S4 3 21 3c0 0 0 10-10 10" />
      <path d="M12 22V12" />
    </svg>
  );
}
function IconStar(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}
function IconPhone(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.64-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.77.64 2.6a2 2 0 0 1-.45 2.11L8 9a16 16 0 0 0 7 7l.57-1.3a2 2 0 0 1 2.11-.45c.83.3 1.7.52 2.6.64A2 2 0 0 1 22 16.92z" />
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
