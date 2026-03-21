import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us — Big Boy Restaurant',
  description:
    'Discover the story, values, and people behind Big Boy Restaurant in Da Nang, Vietnam. Serving exceptional food since 2010.'
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.12),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 md:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <IconStar className="h-3.5 w-3.5" />
              Est. 2010 · Da Nang, Vietnam
            </div>
            <h1 className="mt-4 text-5xl font-extrabold tracking-tight lg:text-6xl">
              Food Worth{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Gathering For
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Big Boy started as a single kitchen with a stubborn belief: great ingredients, honest
              cooking, and a warm table can change someone's day. Fifteen years later, that belief
              still drives us.
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-background px-6 py-8 text-center">
                <dt className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </dt>
                <dd className="mt-2 text-4xl font-black tracking-tight">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Main content — two-col with sticky nav ── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 lg:px-8 lg:py-24">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12 xl:gap-16">
          {/* Sticky sidebar table of contents */}
          <aside className="relative mb-10 hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                On This Page
              </p>
              {TOC.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="space-y-12">
            {/* Our Story */}
            <article id="story" className="scroll-mt-24">
              <SectionHeading icon={IconHeart} label="Our Story" index="01" />
              <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
                <p>
                  Big Boy opened its doors in 2010 with four tables, a wood-fired grill, and a team
                  of three. The founder, Chef Minh, had spent a decade working in kitchens from Hội
                  An to Hanoi and returned to Da Nang with one goal: serve food that felt like home.
                </p>
                <p>
                  Word spread quickly. Within a year, regulars were lining up before opening. We
                  expanded thoughtfully—never chasing scale, always protecting quality. Today Big Boy
                  seats 120 guests and has served over one million dishes, yet every plate still
                  leaves the kitchen the same way it did in 2010: with care.
                </p>
              </div>

              {/* Timeline */}
              <div className="mt-8 space-y-0">
                {TIMELINE.map((event, i) => (
                  <div key={event.year} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-xs font-bold text-primary">
                        {i + 1}
                      </div>
                      {i < TIMELINE.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
                    </div>
                    <div className="pb-8">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {event.year}
                      </span>
                      <p className="mt-0.5 font-semibold text-foreground">{event.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Divider */}
            <hr className="border-border" />

            {/* Our Values */}
            <article id="values" className="scroll-mt-24">
              <SectionHeading icon={IconLeaf} label="Our Values" index="02" />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {VALUES.map((v) => (
                  <div
                    key={v.title}
                    className="rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <v.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{v.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
                  </div>
                ))}
              </div>
            </article>

            <hr className="border-border" />

            {/* Meet the Team */}
            <article id="team" className="scroll-mt-24">
              <SectionHeading icon={IconUsers} label="Meet the Team" index="03" />
              <p className="mt-4 text-muted-foreground">
                Our 50+ team members share one thing: they love feeding people. Here are a few faces
                behind the plates.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {TEAM.map((member) => (
                  <div key={member.name} className="rounded-2xl border bg-card p-5 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-xl font-black text-primary">
                      {member.initials}
                    </div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{member.role}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {member.bio}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <hr className="border-border" />

            {/* Contact */}
            <article id="contact" className="scroll-mt-24">
              <SectionHeading icon={IconMapPin} label="Find Us" index="04" />
              <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
                <div className="grid sm:grid-cols-2">
                  <div className="p-6 md:p-8">
                    <ul className="space-y-4">
                      {CONTACT.map((c) => (
                        <li key={c.label} className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <c.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              {c.label}
                            </p>
                            {c.href ? (
                              <a
                                href={c.href}
                                className="mt-0.5 text-sm font-medium transition-colors hover:text-primary"
                              >
                                {c.value}
                              </a>
                            ) : (
                              <p className="mt-0.5 text-sm">{c.value}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-8">
                    <div className="text-center">
                      <IconMapPin className="mx-auto h-10 w-10 text-primary/40" />
                      <p className="mt-3 text-sm text-muted-foreground">
                        Open daily
                        <br />
                        <span className="font-semibold text-foreground">07:00 – 22:00</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Founded', value: '2010' },
  { label: 'Dishes Served', value: '1M+' },
  { label: 'Local Partners', value: '35+' },
  { label: 'Team Members', value: '50+' }
]

const TOC = [
  { href: '#story', label: 'Our Story', icon: IconHeart },
  { href: '#values', label: 'Our Values', icon: IconLeaf },
  { href: '#team', label: 'Meet the Team', icon: IconUsers },
  { href: '#contact', label: 'Find Us', icon: IconMapPin }
]

const TIMELINE = [
  {
    year: '2010',
    title: 'Grand Opening',
    description: 'Chef Minh opens Big Boy with 4 tables and a wood-fired grill in Hải Châu.'
  },
  {
    year: '2013',
    title: 'First Expansion',
    description: 'Moved to our current location on Nguyễn Văn Linh, tripling capacity.'
  },
  {
    year: '2017',
    title: 'Farm Partnerships',
    description: '35+ local farms join our supply network, ensuring freshness year-round.'
  },
  {
    year: '2022',
    title: 'Digital Ordering',
    description: 'Launched QR code ordering system — zero wait, full service.'
  }
]

const VALUES = [
  {
    title: 'Local Sourcing',
    body: 'We partner with 35+ Da Nang-area farms for seasonal produce picked within 48 hours of serving.',
    icon: IconLeaf
  },
  {
    title: 'Zero Food Waste',
    body: 'Daily specials are built around surplus ingredients. What is not plated is composted or donated.',
    icon: IconRecycle
  },
  {
    title: 'Honest Cooking',
    body: 'No artificial flavors. No shortcuts. Every sauce starts from scratch every morning.',
    icon: IconStar
  },
  {
    title: 'Warm Hospitality',
    body: 'We remember regulars names, not just their orders. Every guest deserves to feel at home.',
    icon: IconHeart
  }
]

const TEAM = [
  {
    name: 'Chef Minh Nguyễn',
    role: 'Founder & Head Chef',
    initials: 'MN',
    bio: '20 years in kitchens from Hội An to Kyoto. Back home to cook food that means something.'
  },
  {
    name: 'Lan Phạm',
    role: 'Operations Manager',
    initials: 'LP',
    bio: 'Keeps the restaurant running like clockwork. Also makes the best staff meals.'
  },
  {
    name: 'Hùng Trần',
    role: 'Sous Chef',
    initials: 'HT',
    bio: 'Specializes in Central Vietnamese cuisine. Obsessed with fermentation and fire.'
  }
]

const CONTACT = [
  {
    label: 'Address',
    value: 'No. 1 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
    href: undefined,
    icon: IconMapPin
  },
  { label: 'Phone', value: '+84 123 456 789', href: 'tel:+84123456789', icon: IconPhone },
  { label: 'Email', value: 'hello@bigboy.vn', href: 'mailto:hello@bigboy.vn', icon: IconMail }
]

// ── Sub-components ─────────────────────────────────────────────────────
function SectionHeading({
  icon: Icon,
  label,
  index
}: {
  icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element
  label: string
  index: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-xs font-bold text-muted-foreground/40">{index}</span>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">{label}</h2>
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────
function IconHeart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20.8 8.6A5.4 5.4 0 0 0 12 7.3a5.4 5.4 0 1 0-8.8 6.3L12 21l8.8-7.4a5.4 5.4 0 0 0 0-5Z" />
    </svg>
  )
}
function IconLeaf(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M11 21C4 21 3 14 3 14S4 3 21 3c0 0 0 10-10 10" /><path d="M12 22V12" />
    </svg>
  )
}
function IconStar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  )
}
function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function IconMapPin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
}
function IconPhone(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.64-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.77.64 2.6a2 2 0 0 1-.45 2.11L8 9a16 16 0 0 0 7 7l.57-1.3a2 2 0 0 1 2.11-.45c.83.3 1.7.52 2.6.64A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}
function IconMail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><path d="m22 6-10 7L2 6" />
    </svg>
  )
}
function IconRecycle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-2.741l1.1-1.944m14.655 4.685h2.185a1.83 1.83 0 0 0 1.57-2.741l-1.1-1.944M12 2l3 5H9l3-5ZM12 2v7m-6.25 9.5L9 15l-3.25-3.5m12.5 7L15 15l3.25-3.5" />
    </svg>
  )
}
