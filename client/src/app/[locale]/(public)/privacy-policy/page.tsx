import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Big Boy Restaurant',
  description: 'Learn how Big Boy Restaurant collects, uses, and protects your personal information.'
}

const LAST_UPDATED = 'March 21, 2025'

const SECTIONS = [
  { id: 'collect', label: 'Data We Collect', number: '§1' },
  { id: 'use', label: 'How We Use It', number: '§2' },
  { id: 'sharing', label: 'Data Sharing', number: '§3' },
  { id: 'retention', label: 'Data Retention', number: '§4' },
  { id: 'rights', label: 'Your Rights', number: '§5' },
  { id: 'security', label: 'Security', number: '§6' },
  { id: 'cookies', label: 'Cookies', number: '§7' },
  { id: 'contact', label: 'Contact', number: '§8' }
]

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.08),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:px-6 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <IconShield className="h-3.5 w-3.5" />
              Privacy Policy
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              We protect your data like we protect our recipes.
            </h1>
            <p className="mt-4 text-muted-foreground">
              Last updated:{' '}
              <time dateTime="2025-03-21" className="font-medium text-foreground">
                {LAST_UPDATED}
              </time>
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              This policy explains what information we collect, why we collect it, and how you can
              control it. We've written it in plain language—no jargon.
            </p>
          </div>
        </div>
      </section>

      {/* ── Body: sidebar ToC + content ── */}
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

          {/* Sections */}
          <div className="space-y-10">
            {/* §1 Data We Collect */}
            <PolicySection id="collect" number="§1" title="Data We Collect" icon={IconShield}>
              <p>We collect information you provide directly and information gathered automatically.</p>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-semibold">Category</th>
                    <th className="pb-2 text-left font-semibold">Examples</th>
                    <th className="pb-2 text-left font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    { cat: 'Identity', ex: 'Name, table number, guest code', src: 'You provide it' },
                    { cat: 'Usage', ex: 'Pages visited, orders placed, chat messages', src: 'Automatic' },
                    { cat: 'Device', ex: 'IP address, browser type, language', src: 'Automatic' },
                    { cat: 'Payment', ex: 'Transaction reference (no card numbers stored)', src: 'Payment processor' }
                  ].map((row) => (
                    <tr key={row.cat}>
                      <td className="py-2.5 font-medium">{row.cat}</td>
                      <td className="py-2.5 text-muted-foreground">{row.ex}</td>
                      <td className="py-2.5 text-muted-foreground">{row.src}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PolicySection>

            {/* §2 How We Use It */}
            <PolicySection id="use" number="§2" title="How We Use It" icon={IconTarget}>
              <CheckList items={[
                { title: 'Process your orders', body: 'Confirm, prepare, and deliver your food order.' },
                { title: 'Improve our service', body: 'Analyze anonymized usage data to improve menus and features.' },
                { title: 'Customer support', body: 'Respond to questions and resolve issues.' },
                { title: 'Safety & fraud prevention', body: 'Detect abuse and protect platform integrity.' },
                { title: 'Marketing (with consent)', body: 'Send promotions only if you have opted in. Unsubscribe anytime.' }
              ]} />
            </PolicySection>

            {/* §3 Data Sharing */}
            <PolicySection id="sharing" number="§3" title="Data Sharing" icon={IconLock}>
              <p>We do not sell your personal data. We may share it only with:</p>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  'Payment processors — to handle transactions securely.',
                  'Hosting and infrastructure providers — to serve our digital products.',
                  'Analytics services — using anonymized or aggregated data only.',
                  'Law enforcement — if legally required with valid authority.'
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </PolicySection>

            {/* §4 Data Retention */}
            <PolicySection id="retention" number="§4" title="Data Retention" icon={IconClock}>
              <p className="text-muted-foreground">
                We retain personal data only as long as necessary:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><span className="font-medium text-foreground">Order data</span> — 3 years for accounting purposes.</li>
                <li><span className="font-medium text-foreground">Chat session data</span> — 90 days, then permanently deleted.</li>
                <li><span className="font-medium text-foreground">Guest session data</span> — deleted when you close your table session.</li>
                <li><span className="font-medium text-foreground">Analytics data</span> — aggregated and anonymized indefinitely.</li>
              </ul>
            </PolicySection>

            {/* §5 Your Rights */}
            <PolicySection id="rights" number="§5" title="Your Rights" icon={IconUser}>
              <p className="text-muted-foreground">Under applicable law, you have the right to:</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { title: 'Access', body: 'Request a copy of the data we hold about you.' },
                  { title: 'Rectification', body: 'Ask us to correct inaccurate data.' },
                  { title: 'Erasure', body: 'Request deletion of your data ("right to be forgotten").' },
                  { title: 'Portability', body: 'Receive your data in a machine-readable format.' },
                  { title: 'Objection', body: 'Object to processing for direct marketing.' },
                  { title: 'Withdraw consent', body: 'Opt out of any optional processing at any time.' }
                ].map((r) => (
                  <div key={r.title} className="rounded-xl border bg-card p-4">
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.body}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                To exercise any right, email{' '}
                <a href="mailto:privacy@bigboy.vn" className="font-medium text-primary underline-offset-4 hover:underline">
                  privacy@bigboy.vn
                </a>
                . We'll respond within 30 days.
              </p>
            </PolicySection>

            {/* §6 Security */}
            <PolicySection id="security" number="§6" title="Security" icon={IconLock}>
              <p className="text-muted-foreground">
                We implement industry-standard measures including TLS encryption in transit, encrypted
                storage at rest, access control policies, and regular security audits. No method of
                transmission over the internet is 100% secure. We notify affected users within 72 hours
                if a data breach occurs.
              </p>
            </PolicySection>

            {/* §7 Cookies */}
            <PolicySection id="cookies" number="§7" title="Cookies" icon={IconDocument}>
              <p className="text-muted-foreground">
                We use minimal, essential cookies only:
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  { name: 'session_token', purpose: 'Keeps you logged in during your table visit.' },
                  { name: 'locale', purpose: 'Remembers your language preference.' },
                  { name: 'csrf_token', purpose: 'Protects against cross-site request forgery.' }
                ].map((c) => (
                  <li key={c.name} className="flex items-start gap-2">
                    <code className="mt-0.5 rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">{c.name}</code>
                    <span className="text-muted-foreground">{c.purpose}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                We do not use advertising, tracking, or third-party analytics cookies.
              </p>
            </PolicySection>

            {/* §8 Contact */}
            <PolicySection id="contact" number="§8" title="Contact" icon={IconMail}>
              <p className="text-muted-foreground">Questions about this policy? Reach our privacy team:</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <a
                  href="mailto:privacy@bigboy.vn"
                  className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
                >
                  <IconMail className="h-4 w-4" />
                  privacy@bigboy.vn
                </a>
                <a
                  href="tel:+84123456789"
                  className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
                >
                  <IconPhone className="h-4 w-4" />
                  +84 123 456 789
                </a>
              </div>
            </PolicySection>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────
function PolicySection({
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

function CheckList({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ul className="mt-2 space-y-3">
      {items.map((item) => (
        <li key={item.title} className="flex items-start gap-3">
          <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{item.title}: </span>
            {item.body}
          </span>
        </li>
      ))}
    </ul>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────
function IconShield(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M12 22s8-4 8-10V6l-8-4-8 4v6c0 6 8 10 8 10Z" /></svg>
}
function IconTarget(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
}
function IconLock(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
}
function IconUser(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
}
function IconClock(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
}
function IconDocument(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
}
function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="m20 6-11 11-5-5" /></svg>
}
function IconMail(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><path d="m22 6-10 7L2 6" /></svg>
}
function IconPhone(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.64-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.77.64 2.6a2 2 0 0 1-.45 2.11L8 9a16 16 0 0 0 7 7l.57-1.3a2 2 0 0 1 2.11-.45c.83.3 1.7.52 2.6.64A2 2 0 0 1 22 16.92z" /></svg>
}
