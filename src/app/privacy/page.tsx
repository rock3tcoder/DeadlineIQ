import Link from 'next/link'
import { Nav } from '@/components/marketing/nav'
import { Footer } from '@/components/marketing/footer'

export const metadata = {
  title: 'Privacy Policy — DeadlineIQ',
}

// TODO: Replace placeholders before launch.
// TODO: Have a licensed attorney review before publishing.

const EFFECTIVE_DATE = 'January 1, 2025'
const COMPANY = '[YOUR COMPANY NAME]'
const EMAIL = 'iqdeadline@gmail.com'

export default function PrivacyPage() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <Nav />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Effective date: {EFFECTIVE_DATE}</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-10 text-slate-300">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Overview</h2>
            <p className="text-sm leading-relaxed">
              {COMPANY} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the DeadlineIQ platform. This Privacy
              Policy explains how we collect, use, store, and share information when you use our
              Service. By using the Service, you agree to the practices described in this Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>

            <h3 className="text-base font-semibold text-slate-200 mb-2">
              2a. Information you provide directly
            </h3>
            <ul className="space-y-2 text-sm mb-6">
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> <strong>Account information:</strong> your name and email address when you sign up</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> <strong>Payment information:</strong> billing details processed by Stripe (we do not store full card numbers)</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> <strong>Source preferences:</strong> which platforms and jurisdictions you choose to monitor</li>
            </ul>

            <h3 className="text-base font-semibold text-slate-200 mb-2">
              2b. Information collected automatically
            </h3>
            <ul className="space-y-2 text-sm mb-6">
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> <strong>Usage data:</strong> pages visited, features used, alert read/unread status</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> <strong>Device and log data:</strong> IP address, browser type, operating system, referral URL</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> <strong>Session cookies:</strong> used to maintain your authenticated session</li>
            </ul>

            <h3 className="text-base font-semibold text-slate-200 mb-2">
              2c. Information we do NOT collect
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> We do not collect business financial data, tax filings, or any documents from your operations</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> We do not sell or rent your personal information to third parties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> To create and manage your account and deliver the Service</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> To send you alert emails and weekly digest emails for your monitored sources</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> To process payments and manage your subscription</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> To monitor and improve service reliability and performance</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> To comply with applicable legal obligations</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> To detect and prevent fraud, abuse, or security incidents</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Service Providers</h2>
            <p className="text-sm leading-relaxed mb-4">
              We use the following trusted third-party services to operate the platform. Each
              provider processes only the minimum data necessary for their function:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border border-slate-800 rounded-lg overflow-hidden">
                <thead className="bg-slate-800/60 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Provider</th>
                    <th className="px-4 py-3 font-medium">Purpose</th>
                    <th className="px-4 py-3 font-medium">Data shared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    ['Supabase', 'Database & authentication', 'Email, name, preferences'],
                    ['Stripe', 'Payment processing', 'Billing info (card data never touches our servers)'],
                    ['Resend', 'Transactional email delivery', 'Email address, alert content'],
                    ['OpenAI', 'AI summarization of scraped content', 'Public regulatory text only — no personal data'],
                    ['Sentry', 'Error monitoring', 'Anonymized error logs and stack traces'],
                    ['Vercel', 'Web hosting', 'Standard web request logs'],
                    ['Railway', 'Scraper infrastructure', 'No personal data'],
                  ].map(([provider, purpose, data]) => (
                    <tr key={provider} className="text-slate-400">
                      <td className="px-4 py-3 font-medium text-slate-300">{provider}</td>
                      <td className="px-4 py-3">{purpose}</td>
                      <td className="px-4 py-3">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> <strong>Account data:</strong> retained for the duration of your account plus 90 days after deletion request</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> <strong>Alert and update history:</strong> retained for 24 months, then archived or deleted</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> <strong>Scraped content snapshots:</strong> retained for 12 months for diff comparison purposes</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> <strong>Billing records:</strong> retained as required by applicable law (typically 7 years)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
            <p className="text-sm leading-relaxed mb-3">
              Depending on your jurisdiction, you may have the following rights regarding your
              personal data:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> <strong>Access:</strong> request a copy of the personal data we hold about you</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> <strong>Correction:</strong> request that we correct inaccurate data</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> <strong>Deletion:</strong> request deletion of your account and associated data</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> <strong>Portability:</strong> request your data in a machine-readable format</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> <strong>Opt-out:</strong> unsubscribe from marketing emails at any time via the unsubscribe link</li>
            </ul>
            <p className="text-sm leading-relaxed mt-3">
              To exercise any of these rights, email us at{' '}
              <a href={`mailto:${EMAIL}`} className="text-blue-400 hover:text-blue-300">
                {EMAIL}
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Cookies</h2>
            <p className="text-sm leading-relaxed">
              We use strictly necessary session cookies to maintain your authenticated state. We do
              not use advertising cookies or third-party tracking cookies. You may disable cookies in
              your browser, but this will prevent you from logging in to the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Security</h2>
            <p className="text-sm leading-relaxed">
              We implement industry-standard security measures including encrypted data transmission
              (TLS), row-level database security, and access controls. However, no system is
              completely secure. You are responsible for maintaining the confidentiality of your
              account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Children</h2>
            <p className="text-sm leading-relaxed">
              The Service is not directed to individuals under the age of 18. We do not knowingly
              collect personal information from children. If you believe a child has provided us with
              personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p className="text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by email or by a prominent notice on the Service. Your continued use of the
              Service after the updated effective date constitutes acceptance of the changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
            <p className="text-sm leading-relaxed">
              Privacy questions or requests should be sent to{' '}
              <a href={`mailto:${EMAIL}`} className="text-blue-400 hover:text-blue-300">
                {EMAIL}
              </a>
              .
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800">
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            ← Back to home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
