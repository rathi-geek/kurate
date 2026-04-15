import Link from "next/link";
import { ROUTES } from "@kurate/utils";

const CONTACT_EMAIL = "privacy@kurate.co.in";

const TOC_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "data-collected", label: "Data We Collect" },
  { id: "how-we-use", label: "How We Use Your Data" },
  { id: "processors", label: "Data Processors" },
  { id: "extension", label: "Browser Extension" },
  { id: "sharing", label: "Data Sharing" },
  { id: "retention", label: "Data Retention" },
  { id: "rights", label: "Your Rights" },
  { id: "cookies", label: "Cookies & Storage" },
  { id: "children", label: "Children's Privacy" },
  { id: "changes", label: "Policy Changes" },
  { id: "contact", label: "Contact" },
] as const;

const EXTENSION_PERMISSIONS = [
  {
    name: "tabs",
    reason:
      'To read the URL and title of the currently active browser tab when you click "Save to Vault", and to open the Kurate login page in a new tab during authentication.',
  },
  {
    name: "storage",
    reason: (
      <>
        To persist your authentication session locally in the browser so you
        stay signed in between browser restarts. Data is stored only in{" "}
        <Code>chrome.storage.local</Code> on your device and is never sent to
        any third party other than Supabase for token verification.
      </>
    ),
  },
  {
    name: "alarms",
    reason:
      "To schedule a background token refresh every 10 minutes so your session does not expire while the extension is open.",
  },
] as const;

const USER_RIGHTS = [
  {
    right: "Access",
    desc: "Request a copy of all personal data we hold about you.",
  },
  {
    right: "Rectification",
    desc: "Correct inaccurate or incomplete data.",
  },
  {
    right: "Erasure",
    desc: 'Delete your account and all associated data ("right to be forgotten").',
  },
  {
    right: "Portability",
    desc: "Receive your vault data in a structured, machine-readable format (JSON).",
  },
  {
    right: "Restriction",
    desc: "Request that we limit processing of your data in certain circumstances.",
  },
  {
    right: "Objection",
    desc: "Object to processing based on legitimate interests.",
  },
] as const;

interface Props {
  effectiveDate: string;
}

export function PrivacyPageContent({ effectiveDate }: Props) {
  return (
    <div className="container-page mx-auto px-6 py-12">
      <div className="flex gap-12">
        {/* Sticky TOC — desktop only */}
        <aside className="hidden lg:block w-52 shrink-0">
          <nav aria-label="Privacy policy sections" className="sticky top-8">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Contents
            </p>
            <ul className="space-y-1">
              {TOC_SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block rounded-button px-2 py-1 text-sm text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main id="main-content" className="container-content min-w-0 flex-1">
          <div className="mb-10">
            <h1 className="font-serif text-4xl text-ink mb-3">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-sm">
              Effective date: {effectiveDate}
            </p>
          </div>

          <div className="space-y-12">
            <Section id="overview" heading="Overview">
              <Prose>
                <p>
                  Kurate (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
                  operates the Kurate web application at{" "}
                  <a
                    href="https://kurate.co.in"
                    className="text-primary hover:underline"
                  >
                    kurate.co.in
                  </a>{" "}
                  and the Kurate browser extension for Google Chrome. This
                  Privacy Policy explains what personal data we collect, why we
                  collect it, how we use and store it, and what rights you have
                  over your data.
                </p>
                <p>
                  We collect only what is necessary to provide the service. We
                  do not sell, rent, or trade your personal information to any
                  third party — ever.
                </p>
                <p>
                  By using Kurate you agree to the practices described in this
                  policy. If you do not agree, please discontinue use and
                  contact us to request deletion of your data.
                </p>
              </Prose>
            </Section>

            <Divider />

            <Section id="data-collected" heading="Data We Collect">
              <Prose>
                <p>
                  We collect data in three ways: data you provide directly,
                  data generated automatically when you use the service, and
                  data collected by the browser extension when you explicitly
                  trigger a save.
                </p>
              </Prose>
              <div className="mt-6 space-y-4">
                <DataCard title="Account & authentication">
                  <ul>
                    <li>
                      <strong>Email address</strong> — used to create and
                      identify your account. Collected when you sign up or log
                      in via magic link.
                    </li>
                    <li>
                      <strong>Authentication tokens</strong> — short-lived
                      access tokens and refresh tokens issued by Supabase Auth
                      to keep you signed in. Stored encrypted in your browser.
                    </li>
                  </ul>
                </DataCard>
                <DataCard title="Content you save (vault items)">
                  <ul>
                    <li>
                      <strong>Page URL</strong> — the web address of the page
                      you saved.
                    </li>
                    <li>
                      <strong>Page title & description</strong> — extracted
                      from the page&apos;s metadata (og:title, og:description)
                      at the time of saving.
                    </li>
                    <li>
                      <strong>Preview image URL</strong> — the og:image of the
                      saved page, stored as a reference URL (we do not copy or
                      re-host images).
                    </li>
                    <li>
                      <strong>Content type, author, read time</strong> —
                      extracted automatically from page metadata where
                      available.
                    </li>
                    <li>
                      <strong>Remarks & tags</strong> — any notes or labels you
                      add manually to a saved item.
                    </li>
                  </ul>
                </DataCard>
                <DataCard title="Profile & preferences">
                  <ul>
                    <li>
                      <strong>Username & display name</strong> — chosen during
                      onboarding.
                    </li>
                    <li>
                      <strong>Interests</strong> — topic preferences you select
                      to personalise your discover feed.
                    </li>
                  </ul>
                </DataCard>
                <DataCard title="Usage & analytics">
                  <ul>
                    <li>
                      <strong>Page views & navigation events</strong> —
                      collected by Vercel Analytics (privacy-friendly, no
                      cookies, no fingerprinting, IP is not stored).
                    </li>
                    <li>
                      <strong>Performance metrics</strong> — collected by
                      Vercel Speed Insights. Aggregated only; no individual
                      user profiles are built.
                    </li>
                  </ul>
                </DataCard>
              </div>
            </Section>

            <Divider />

            <Section id="how-we-use" heading="How We Use Your Data">
              <Prose>
                <p>We use the data we collect solely to:</p>
                <ul>
                  <li>Create and manage your account</li>
                  <li>
                    Save, display, and organise content in your personal vault
                  </li>
                  <li>
                    Power the AI-assisted discover feed based on your saved
                    content and interests
                  </li>
                  <li>
                    Authenticate requests from the browser extension to your
                    account
                  </li>
                  <li>
                    Send transactional emails (magic-link login, account
                    changes) — no marketing emails without explicit opt-in
                  </li>
                  <li>
                    Monitor service health, diagnose errors, and improve
                    performance
                  </li>
                </ul>
                <p>
                  <strong>Legal basis (GDPR):</strong> Processing is necessary
                  for the performance of the contract between you and Kurate
                  (Art. 6(1)(b) GDPR), or based on our legitimate interest in
                  operating and improving the service (Art. 6(1)(f) GDPR).
                  Where we rely on consent (e.g. optional marketing
                  communications), you can withdraw it at any time.
                </p>
              </Prose>
            </Section>

            <Divider />

            <Section id="processors" heading="Data Processors">
              <Prose>
                <p>
                  We use the following third-party sub-processors to operate
                  the service. Each is bound by a Data Processing Agreement and
                  handles your data only under our instructions.
                </p>
              </Prose>
              <div className="mt-6 space-y-4">
                <DataCard title="Supabase (database & authentication)">
                  <p>
                    Supabase stores all vault items, user profiles, and
                    authentication credentials. Data is hosted in their managed
                    cloud infrastructure. Supabase is SOC 2 Type II certified
                    and GDPR-compliant. Data is encrypted at rest and in
                    transit. For details, see{" "}
                    <a
                      href="https://supabase.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Supabase Privacy Policy
                    </a>
                    .
                  </p>
                </DataCard>
                <DataCard title="Vercel (hosting & analytics)">
                  <p>
                    Vercel hosts the Kurate web application. Vercel Analytics
                    and Speed Insights are used for aggregate, cookie-free
                    performance monitoring. No personal data is shared with
                    Vercel beyond what is necessary to serve web requests. See{" "}
                    <a
                      href="https://vercel.com/legal/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Vercel Privacy Policy
                    </a>
                    .
                  </p>
                </DataCard>
              </div>
              <Prose className="mt-6">
                <p>
                  We do not use any advertising networks, data brokers, or
                  social media tracking pixels.
                </p>
              </Prose>
            </Section>

            <Divider />

            <Section id="extension" heading="Browser Extension — Specific Disclosures">
              <Prose>
                <p>
                  The Kurate Chrome extension has the following Chrome-declared
                  permissions. We disclose exactly why each is needed.
                </p>
              </Prose>
              <div className="mt-6 overflow-x-auto rounded-card border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="px-4 py-3 text-left font-medium text-ink">
                        Permission
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-ink">
                        Why it is needed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {EXTENSION_PERMISSIONS.map(({ name, reason }) => (
                      <tr key={name}>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground align-top whitespace-nowrap">
                          {name}
                        </td>
                        <td className="px-4 py-3 text-foreground">{reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Prose className="mt-6">
                <p>
                  <strong>What the extension does NOT do:</strong> It does not
                  read page content, intercept network requests, inject scripts
                  into web pages, monitor your browsing history, or collect any
                  data beyond the URL and title of a page you explicitly choose
                  to save.
                </p>
                <p>
                  Authentication tokens stored by the extension are scoped to{" "}
                  <Code>chrome.storage.local</Code> — they are not synced
                  across devices via Chrome Sync.
                </p>
              </Prose>
            </Section>

            <Divider />

            <Section id="sharing" heading="Data Sharing">
              <Prose>
                <p>
                  <strong>We do not sell your data.</strong> We do not share
                  your personal information with advertisers, data brokers, or
                  any third party for commercial purposes.
                </p>
                <p>
                  We may share data only in the following limited cases:
                </p>
                <ul>
                  <li>
                    <strong>Sub-processors</strong> — as listed in the Data
                    Processors section above, strictly to operate the service.
                  </li>
                  <li>
                    <strong>Legal obligations</strong> — if required by
                    applicable law, court order, or governmental authority, we
                    will disclose data only to the extent legally compelled and
                    will notify you where permitted.
                  </li>
                  <li>
                    <strong>Business transfer</strong> — in the event of a
                    merger, acquisition, or sale of assets, your data may be
                    transferred. We will notify you via email and provide a
                    30-day opt-out window before any transfer occurs.
                  </li>
                </ul>
              </Prose>
            </Section>

            <Divider />

            <Section id="retention" heading="Data Retention">
              <Prose>
                <ul>
                  <li>
                    <strong>Account data</strong> is retained for as long as
                    your account is active. When you delete your account, all
                    personal data including vault items, profile, and
                    preferences is permanently deleted within 30 days.
                  </li>
                  <li>
                    <strong>Authentication tokens</strong> stored by the
                    extension are cleared immediately when you sign out or
                    uninstall the extension.
                  </li>
                  <li>
                    <strong>Analytics data</strong> from Vercel is aggregate
                    and not linked to individual users; it is retained per
                    Vercel&apos;s default retention schedule.
                  </li>
                  <li>
                    <strong>Backups</strong> — data may persist in encrypted
                    database backups for up to 30 days after deletion.
                  </li>
                </ul>
              </Prose>
            </Section>

            <Divider />

            <Section id="rights" heading="Your Rights">
              <Prose>
                <p>
                  Depending on your location, you may have the following rights
                  over your personal data. To exercise any of them, email{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-primary hover:underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
              </Prose>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {USER_RIGHTS.map(({ right, desc }) => (
                  <div
                    key={right}
                    className="rounded-card border border-border bg-card p-4"
                  >
                    <p className="font-medium text-ink text-sm mb-1">{right}</p>
                    <p className="text-muted-foreground text-sm">{desc}</p>
                  </div>
                ))}
              </div>
              <Prose className="mt-6">
                <p>
                  <strong>California residents (CCPA/CPRA):</strong> You have
                  the right to know, delete, and opt out of the sale of
                  personal information. We do not sell personal information.
                  You also have the right to non-discrimination for exercising
                  your privacy rights.
                </p>
                <p>
                  <strong>EU/UK residents (GDPR/UK GDPR):</strong> You have
                  the right to lodge a complaint with your local supervisory
                  authority if you believe we are processing your data
                  unlawfully.
                </p>
                <p>
                  We will respond to all rights requests within 30 days (or
                  within the timeframe required by applicable law).
                </p>
              </Prose>
            </Section>

            <Divider />

            <Section id="cookies" heading="Cookies & Local Storage">
              <Prose>
                <p>
                  <strong>Web application:</strong> We use a single first-party
                  session cookie set by Supabase to maintain your authenticated
                  session. No third-party cookies are set. Vercel Analytics is
                  cookieless.
                </p>
                <p>
                  <strong>Browser extension:</strong> The extension uses{" "}
                  <Code>chrome.storage.local</Code> (not browser cookies) to
                  store authentication tokens. This storage is local to your
                  device and is not accessible by websites.
                </p>
                <p>
                  You can clear extension storage at any time by signing out
                  from the extension popup, or by removing the extension from
                  Chrome.
                </p>
              </Prose>
            </Section>

            <Divider />

            <Section id="children" heading="Children's Privacy">
              <Prose>
                <p>
                  Kurate is not directed to children under the age of 16 (or
                  13 where applicable by local law). We do not knowingly
                  collect personal information from children. If you believe a
                  child has provided us with personal data, please contact us
                  at{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-primary hover:underline"
                  >
                    {CONTACT_EMAIL}
                  </a>{" "}
                  and we will promptly delete it.
                </p>
              </Prose>
            </Section>

            <Divider />

            <Section id="changes" heading="Changes to This Policy">
              <Prose>
                <p>
                  We may update this policy from time to time. When we make
                  material changes we will notify you by email (at the address
                  associated with your account) at least 14 days before the
                  changes take effect. The &quot;Last updated&quot; date at the
                  top of this page reflects when the current version was
                  published.
                </p>
                <p>
                  Continued use of the service after the effective date
                  constitutes acceptance of the revised policy.
                </p>
              </Prose>
            </Section>

            <Divider />

            <Section id="contact" heading="Contact">
              <Prose>
                <p>
                  For any questions, concerns, or rights requests regarding
                  this Privacy Policy or your personal data, please contact us:
                </p>
              </Prose>
              <div className="mt-4 rounded-card border border-border bg-card p-6">
                <p className="font-medium text-ink mb-1">Kurate</p>
                <p className="text-muted-foreground text-sm">
                  Email:{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-primary hover:underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Website:{" "}
                  <a
                    href="https://kurate.co.in"
                    className="text-primary hover:underline"
                  >
                    kurate.co.in
                  </a>
                </p>
              </div>
            </Section>
          </div>

          {/* Footer nav */}
          <div className="mt-16 flex items-center justify-between border-t border-border pt-8">
            <Link
              href={ROUTES.HOME}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to home
            </Link>
            <span className="font-mono text-xs text-muted-foreground">
              {effectiveDate}
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- primitives ---------- */

function Section({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`h-${id}`}>
      <h2 id={`h-${id}`} className="font-serif text-2xl text-ink mb-4 scroll-mt-8">
        {heading}
      </h2>
      {children}
    </section>
  );
}

function Prose({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "space-y-4 text-foreground text-sm leading-relaxed",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2",
        "[&_strong]:text-ink [&_strong]:font-medium",
        "[&_a]:text-primary [&_a:hover]:underline",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

function DataCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-card p-5">
      <p className="font-medium text-ink text-sm mb-3">{title}</p>
      <div className="text-sm text-foreground leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-ink">
        {children}
      </div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-xs bg-surface px-1 rounded">{children}</code>
  );
}

function Divider() {
  return <hr className="border-border" />;
}
