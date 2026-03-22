import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Big Boy Restaurant',
  description:
    'Read the terms and conditions that govern your use of Big Boy Restaurant is website and ordering services.'
}

const LAST_UPDATED = 'March 21, 2025'

const SECTIONS = [
  { id: 'intro', label: 'Introduction', number: '§1' },
  { id: 'services', label: 'Our Services', number: '§2' },
  { id: 'use', label: 'Acceptable Use', number: '§3' },
  { id: 'orders', label: 'Orders & Payments', number: '§4' },
  { id: 'ip', label: 'Intellectual Property', number: '§5' },
  { id: 'liability', label: 'Limitation of Liability', number: '§6' },
  { id: 'changes', label: 'Changes to Terms', number: '§7' },
  { id: 'contact', label: 'Contact', number: '§8' }
]

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.08),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:px-6 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <IconDocument className="h-3.5 w-3.5" />
              Terms of Service
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              Simple rules for a great experience.
            </h1>
            <p className="mt-4 text-muted-foreground">
              Last updated:{' '}
              <time dateTime="2025-03-21" className="font-medium text-foreground">
                {LAST_UPDATED}
              </time>
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              By accessing our website or placing an order, you agree to these terms. We&apos;ve kept them
              short and in plain English.
            </p>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 lg:px-8 lg:py-20">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12 xl:gap-16">
          {/* Sticky Sidebar */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-0.5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Sections
              </p>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="font-mono text-[10px] font-bold text-muted-foreground/50">
                    {s.number}
                  </span>
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="space-y-10">
            {/* §1 Introduction */}
            <TermSection id="intro" number="§1" title="Introduction" icon={IconDocument}>
              <p className="text-muted-foreground">
                These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Big Boy
                Restaurant website, mobile-friendly ordering platform, and related digital services
                (collectively, &quot;Services&quot;). By using our Services, you confirm that you are at least
                13 years of age and agree to be bound by these Terms.
              </p>
              <p className="mt-3 text-muted-foreground">
                If you are using our Services on behalf of a business, you represent that you have
                the authority to bind that business to these Terms.
              </p>
            </TermSection>

            {/* §2 Our Services */}
            <TermSection id="services" number="§2" title="Our Services" icon={IconStar}>
              <p className="text-muted-foreground">Big Boy Restaurant provides:</p>
              <ul className="mt-3 space-y-2">
                {[
                  'QR code–based table ordering — scan, browse, and place orders from your seat.',
                  'Menu browsing — view dishes, prices, allergens, and descriptions.',
                  'AI-powered assistant — get recommendations and place orders in natural language.',
                  'Order status tracking — see real-time updates on your order.',
                  'Review and rating system — share feedback about your experience.'
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                We reserve the right to modify, suspend, or discontinue any part of the Services at
                any time with reasonable notice.
              </p>
            </TermSection>

            {/* §3 Acceptable Use */}
            <TermSection id="use" number="§3" title="Acceptable Use" icon={IconShield}>
              <p className="text-muted-foreground">You agree not to:</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { title: 'Disrupt the service', body: 'No DDoS, scraping, or automated abuse of our systems.' },
                  { title: 'Impersonate others', body: 'Do not misrepresent your identity or affiliation.' },
                  { title: 'Post harmful content', body: 'No spam, hate speech, or illegal content in reviews or chat.' },
                  { title: 'Circumvent security', body: 'Do not attempt to bypass authentication or access controls.' },
                  { title: 'Violate laws', body: 'Use our Services only in compliance with applicable laws.' },
                  { title: 'Infringe IP rights', body: 'Do not reproduce or redistribute our content without permission.' }
                ].map((r) => (
                  <div key={r.title} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <IconX className="h-3.5 w-3.5 text-destructive" />
                      <p className="text-sm font-semibold">{r.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.body}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Violations may result in immediate suspension of access and, where appropriate, legal
                action.
              </p>
            </TermSection>

            {/* §4 Orders & Payments */}
            <TermSection id="orders" number="§4" title="Orders & Payments" icon={IconCreditCard}>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">Order placement</p>
                  <p className="mt-1">
                    Orders placed through our QR platform are binding once confirmed by our kitchen.
                    The AI assistant may ask you to confirm before submitting — always review the
                    confirmation card before approving.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Pricing</p>
                  <p className="mt-1">
                    All prices are displayed in USD and are inclusive of applicable taxes. Prices may
                    change without notice but your confirmed order is locked at the price shown at
                    time of order.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Cancellations</p>
                  <p className="mt-1">
                    Orders can be cancelled while in &quot;Pending&quot; status. Once the kitchen has begun
                    preparation (&quot;Processing&quot;), cancellation is not guaranteed. Use the Cancel Order
                    option in the AI assistant or contact staff directly.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Coupons & Promotions</p>
                  <p className="mt-1">
                    Coupons are subject to their stated terms (minimum order, expiry date,
                    single-use). Only one coupon may be applied per order. We reserve the right to
                    revoke promotions that are abused.
                  </p>
                </div>
              </div>
            </TermSection>

            {/* §5 Intellectual Property */}
            <TermSection id="ip" number="§5" title="Intellectual Property" icon={IconGavel}>
              <p className="text-muted-foreground">
                All content on our website and platform — including text, images, logos, menus,
                software, and AI-generated responses — is owned by Big Boy Restaurant or its licensors
                and protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="mt-3 text-muted-foreground">
                You may not reproduce, distribute, modify, or create derivative works from our content
                without prior written permission. Limited reproduction for personal, non-commercial
                use is permitted with attribution.
              </p>
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
                <p className="font-medium text-primary">Fair Use Note</p>
                <p className="mt-1 text-muted-foreground">
                  Screenshots and reviews for editorial, journalistic, or educational purposes are
                  generally welcome. When in doubt, email{' '}
                  <a href="mailto:hello@bigboy.vn" className="text-primary hover:underline">
                    hello@bigboy.vn
                  </a>
                  .
                </p>
              </div>
            </TermSection>

            {/* §6 Limitation of Liability */}
            <TermSection id="liability" number="§6" title="Limitation of Liability" icon={IconScale}>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, Big Boy Restaurant and its affiliates shall
                not be liable for any indirect, incidental, special, consequential, or punitive
                damages arising from your use of the Services.
              </p>
              <p className="mt-3 text-muted-foreground">
                Our total liability for any claim arising from these Terms shall not exceed the
                amount you paid us in the 30 days preceding the event giving rise to the claim.
              </p>
              <p className="mt-3 text-muted-foreground">
                Nothing in these Terms limits our liability for death or personal injury caused by our
                negligence, or for fraud or fraudulent misrepresentation.
              </p>
            </TermSection>

            {/* §7 Changes to Terms */}
            <TermSection id="changes" number="§7" title="Changes to Terms" icon={IconRefresh}>
              <p className="text-muted-foreground">
                We may update these Terms from time to time. When we do, we will:
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  'Update the "Last updated" date at the top of this page.',
                  'Post a notice on our website for material changes.',
                  'Send an in-app notification where possible.'
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Your continued use of our Services after any changes constitutes acceptance of the
                updated Terms. If you disagree with the new Terms, discontinue use of our Services.
              </p>
            </TermSection>

            {/* §8 Contact */}
            <TermSection id="contact" number="§8" title="Contact" icon={IconMail}>
              <p className="text-muted-foreground">
                Questions about these Terms? Contact us:
              </p>
              <div className="mt-4 overflow-hidden rounded-2xl border bg-card">
                <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  {[
                    { label: 'General', value: 'hello@bigboy.vn', href: 'mailto:hello@bigboy.vn', icon: IconMail },
                    { label: 'Legal', value: 'legal@bigboy.vn', href: 'mailto:legal@bigboy.vn', icon: IconGavel },
                    { label: 'Phone', value: '+84 123 456 789', href: 'tel:+84123456789', icon: IconPhone }
                  ].map((c) => (
                    <a
                      key={c.label}
                      href={c.href}
                      className="flex flex-col items-center gap-2 p-5 text-center transition-colors hover:bg-accent"
                    >
                      <c.icon className="h-5 w-5 text-primary" />
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {c.label}
                      </span>
                      <span className="text-sm font-medium">{c.value}</span>
                    </a>
                  ))}
                </div>
              </div>
            </TermSection>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────
function TermSection({
  id,
  number,
  title,
  icon: Icon,
  children
}: {
  id: string
  number: string
  title: string
  icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-xs font-bold text-muted-foreground/40">{number}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="ml-14 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────
function IconDocument(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
}
function IconStar(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" /></svg>
}
function IconShield(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M12 22s8-4 8-10V6l-8-4-8 4v6c0 6 8 10 8 10Z" /></svg>
}
function IconCheck(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="m20 6-11 11-5-5" /></svg>
}
function IconX(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
}
function IconCreditCard(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><path d="M1 10h22" /></svg>
}
function IconGavel(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M14 13l6 6" /><path d="M8 7l6 6" /><path d="M2 22h7" /><path d="M9 7l4-4 4 4-4 4z" /></svg>
}
function IconScale(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M12 3v18" /><path d="M3 6l9-3 9 3" /><path d="m3 6 4 10a2 2 0 0 0 4 0L3 6" /><path d="m21 6-4 10a2 2 0 0 1-4 0l8-10" /></svg>
}
function IconRefresh(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
}
function IconMail(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><path d="m22 6-10 7L2 6" /></svg>
}
function IconPhone(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.64-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.77.64 2.6a2 2 0 0 1-.45 2.11L8 9a16 16 0 0 0 7 7l.57-1.3a2 2 0 0 1 2.11-.45c.83.3 1.7.52 2.6.64A2 2 0 0 1 22 16.92z" /></svg>
}
