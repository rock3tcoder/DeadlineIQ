import Link from 'next/link'
import { Nav } from '@/components/marketing/nav'
import { Footer } from '@/components/marketing/footer'
import { PLATFORM_DISCLAIMER } from '@/types'

export const metadata = {
  title: 'Terms of Service — DeadlineIQ',
}

// TODO: Replace [YOUR NAME / COMPANY NAME] and [YOUR STATE] before launch.
// TODO: Have a licensed attorney review before publishing.

const EFFECTIVE_DATE = 'January 1, 2025'
const COMPANY = '[YOUR COMPANY NAME]'
const STATE = '[YOUR STATE]'
const EMAIL = 'iqdeadline@gmail.com'

export default function TermsPage() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <Nav />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-slate-500 text-sm mb-10">Effective date: {EFFECTIVE_DATE}</p>

        {/* Disclaimer banner */}
        <div className="mb-10 rounded-lg border border-amber-500/20 bg-amber-500/5 px-5 py-4">
          <p className="text-sm text-amber-200/70 font-medium leading-relaxed">
            {PLATFORM_DISCLAIMER}
          </p>
        </div>

        <div className="prose prose-invert prose-slate max-w-none space-y-10 text-slate-300">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed">
              By accessing or using the DeadlineIQ platform (&quot;Service&quot;), operated by {COMPANY}
              (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of
              Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p className="text-sm leading-relaxed mb-3">
              DeadlineIQ is an automated regulatory and policy update intelligence platform. The
              Service monitors publicly available official sources — including e-commerce platform
              policy pages and government tax authority websites — and delivers informational
              summaries of detected changes to subscribers.
            </p>
            <p className="text-sm leading-relaxed mb-3 font-semibold text-amber-200/80">
              THE SERVICE IS STRICTLY INFORMATIONAL. IT DOES NOT PROVIDE LEGAL, TAX, ACCOUNTING,
              COMPLIANCE, OR REGULATORY ADVICE OF ANY KIND.
            </p>
            <p className="text-sm leading-relaxed">
              Specifically, the Service:
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> Does not tell users what they are legally required to do</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> Does not certify that any user is in compliance with any law or regulation</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> Does not file or submit any document on behalf of any user</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> Does not create an attorney-client, accountant-client, or other advisory relationship</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> Does not replace the advice of a qualified attorney, tax professional, or accountant</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> Does not provide personalized recommendations for any specific user&apos;s situation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. No Advisory Relationship</h2>
            <p className="text-sm leading-relaxed">
              Your use of the Service does not create any advisory, fiduciary, attorney-client,
              accountant-client, or other professional relationship between you and {COMPANY}.
              Nothing in the Service or in any communication from {COMPANY} constitutes legal,
              tax, financial, or compliance advice. You acknowledge that {COMPANY} is not a law
              firm, accounting firm, tax advisor, or regulatory consultant, and that no such
              relationship is intended or created by your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. User Responsibility</h2>
            <p className="text-sm leading-relaxed mb-3">
              You are solely responsible for:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> Independently verifying all information delivered by the Service with official sources</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> Consulting qualified legal, tax, or compliance professionals before taking any action</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> Determining the applicability of any update to your specific situation</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> Meeting all applicable legal and regulatory obligations for your business</li>
              <li className="flex items-start gap-2"><span className="text-slate-500 mt-0.5">—</span> Ensuring the accuracy and timeliness of any filings, submissions, or compliance actions</li>
            </ul>
            <p className="text-sm leading-relaxed mt-3">
              You acknowledge that AI-generated summaries may contain errors, omissions, or
              inaccuracies and that official source content may change after a summary is generated.
              Always verify information at the direct official source link provided with each update.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Subscriptions and Billing</h2>
            <p className="text-sm leading-relaxed mb-3">
              The Service is offered on a subscription basis. By subscribing, you authorize us to
              charge your payment method on a recurring monthly basis at the rate for your selected
              plan. All fees are stated in USD and are non-refundable except as required by
              applicable law or as expressly stated in these Terms.
            </p>
            <p className="text-sm leading-relaxed mb-3">
              We offer a 14-day free trial. No credit card is required to start a trial. After the
              trial period, a subscription and valid payment method are required to continue using
              the Service. You may cancel at any time; cancellation takes effect at the end of the
              current billing period.
            </p>
            <p className="text-sm leading-relaxed">
              We reserve the right to change subscription pricing with 30 days&apos; advance notice to
              the email address on your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Disclaimer of Warranties</h2>
            <p className="text-sm leading-relaxed mb-3 font-semibold text-amber-200/80">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
              WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE.
            </p>
            <p className="text-sm leading-relaxed">
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, {COMPANY} EXPRESSLY DISCLAIMS ALL
              WARRANTIES, INCLUDING BUT NOT LIMITED TO: (A) IMPLIED WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT; (B) WARRANTIES THAT THE
              SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE; (C) WARRANTIES REGARDING THE
              ACCURACY, COMPLETENESS, OR TIMELINESS OF ANY CONTENT DELIVERED THROUGH THE SERVICE;
              AND (D) WARRANTIES THAT ANY INFORMATION PROVIDED BY THE SERVICE IS LEGALLY ACCURATE
              OR APPLICABLE TO YOUR SPECIFIC SITUATION.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
            <p className="text-sm leading-relaxed mb-3 font-semibold text-amber-200/80">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL {COMPANY}, ITS
              OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT
              NOT LIMITED TO LOST PROFITS, LOST REVENUE, LOSS OF DATA, BUSINESS INTERRUPTION, OR
              REPUTATIONAL HARM, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE
              SERVICE.
            </p>
            <p className="text-sm leading-relaxed">
              IN ANY CASE, {COMPANY}&apos;S TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS ARISING
              OUT OF OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE TOTAL AMOUNT OF
              SUBSCRIPTION FEES YOU PAID TO {COMPANY} DURING THE TWELVE (12) MONTH PERIOD
              IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Indemnification</h2>
            <p className="text-sm leading-relaxed">
              You agree to indemnify, defend, and hold harmless {COMPANY} and its officers,
              directors, employees, agents, and affiliates from and against any claims, liabilities,
              damages, losses, costs, and expenses (including reasonable attorneys&apos; fees) arising
              out of or related to: (a) your use of the Service; (b) your violation of these Terms;
              (c) your violation of any applicable law, regulation, or third-party right; (d) any
              action or inaction you take or fail to take in reliance on information provided by the
              Service; or (e) any tax filing, regulatory submission, or compliance action (or
              failure to act) related to your business.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Force Majeure</h2>
            <p className="text-sm leading-relaxed">
              {COMPANY} shall not be liable for any failure or delay in performing its obligations
              under these Terms to the extent that such failure or delay is caused by events beyond
              its reasonable control, including but not limited to: acts of God, natural disasters,
              pandemic, government actions, changes in law or regulation, third-party platform
              policy changes, internet or infrastructure outages, cyberattacks, or labor disputes.
              In the event of a force majeure event, {COMPANY} will use reasonable efforts to
              notify affected users and resume service as soon as practicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Intellectual Property</h2>
            <p className="text-sm leading-relaxed">
              The Service and all content, features, and functionality are owned by {COMPANY} and
              are protected by applicable intellectual property laws. You may not copy, reproduce,
              distribute, or create derivative works from any part of the Service without our
              express written permission. Summaries generated by the Service may not be resold or
              redistributed as regulatory advice or compliance guidance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Termination</h2>
            <p className="text-sm leading-relaxed">
              We may suspend or terminate your account at any time for violation of these Terms,
              non-payment, or any other reason with or without notice. Upon termination, your right
              to use the Service immediately ceases. You may cancel your account at any time through
              the billing settings in your dashboard. Sections 3, 4, 6, 7, 8, and 12 of these Terms
              survive termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Governing Law; Disputes</h2>
            <p className="text-sm leading-relaxed">
              These Terms shall be governed by the laws of the State of {STATE}, without regard to
              its conflict of law principles. Any dispute arising out of or relating to these Terms
              or the Service shall be resolved by binding arbitration in {STATE}, except that either
              party may seek injunctive or other equitable relief in a court of competent
              jurisdiction for intellectual property claims.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Changes to Terms</h2>
            <p className="text-sm leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of material
              changes by email or by posting a notice on the Service. Your continued use of the
              Service after the effective date of the updated Terms constitutes acceptance of the
              changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">14. Contact</h2>
            <p className="text-sm leading-relaxed">
              Questions about these Terms should be sent to{' '}
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
