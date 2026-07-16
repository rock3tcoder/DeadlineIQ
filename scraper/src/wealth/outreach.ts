// Draft outreach templates for each opportunity category.
//
// IMPORTANT: These drafts are NEVER sent automatically. They are saved to
// wealth_alerts.draft_body_text for the user to copy, personalise, and
// send manually from their own email client.
//
// H1B note: templates reference passive/investor ownership — the user
// must consult an immigration attorney before proceeding with any
// acquisition or investment.

function formatMoney(cents: number | null): string {
  if (cents === null) return 'undisclosed'
  const d = cents / 100
  if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}M`
  if (d >= 1_000) return `$${(d / 1_000).toFixed(0)}K`
  return `$${d.toFixed(0)}`
}

// ─── Business for sale ───────────────────────────────────────

export interface BusinessOutreachContext {
  businessTitle: string
  askingPrice: number | null
  cashFlow: number | null
  location: string | null
  listingUrl: string
}

export function buildBusinessOutreachDraft(ctx: BusinessOutreachContext): {
  subject: string
  body: string
} {
  return {
    subject: `Interest in acquiring: ${ctx.businessTitle}`,
    body: `Hello,

I came across your listing for "${ctx.businessTitle}" on BizBuySell and wanted to reach out about a potential acquisition.

Asking price: ${formatMoney(ctx.askingPrice)}
Cash flow: ${formatMoney(ctx.cashFlow)}${ctx.location ? `\nLocation: ${ctx.location}` : ''}
Listing: ${ctx.listingUrl}

I am a passive investor seeking to acquire a well-run business with stable cash flows. I am specifically looking for businesses that can operate with minimal day-to-day owner involvement, as I would be stepping into an investor/silent-partner role.

I have liquid capital available and am prepared to move quickly for the right opportunity. Could you share:

1. A brief description of day-to-day operations and management structure
2. Your reason for selling
3. Whether the current management team is willing to stay on post-acquisition

I would love to schedule a 20-minute call at your convenience to learn more.

Best regards,
[Your Name]
[Your Email]
[Your Phone]

---
DRAFT ONLY — Review and personalise before sending.
Consult an immigration attorney regarding H1B passive-ownership rules before proceeding.`,
  }
}

// ─── Capital injection / equity opportunity ──────────────────

export interface CapitalOutreachContext {
  companyName: string
  amountSeeking: number | null
  industry: string | null
  listingUrl: string
}

export function buildCapitalOutreachDraft(ctx: CapitalOutreachContext): {
  subject: string
  body: string
} {
  return {
    subject: `Investor interest in ${ctx.companyName}`,
    body: `Hello,

I noticed ${ctx.companyName}'s listing on Acquire.com${ctx.industry ? ` under the ${ctx.industry} category` : ''} and am interested in exploring a potential acquisition or investment.

Amount seeking: ${formatMoney(ctx.amountSeeking)}
Listing: ${ctx.listingUrl}

I am a passive investor with liquid capital available, focused on profitable online businesses and SaaS products with consistent recurring revenue. I am not looking to take an operational role — I would be a hands-off investor, retaining your existing team and operational structure.

I would like to understand more about:

1. Current MRR/ARR and month-over-month growth
2. Churn rate and customer concentration
3. Technical infrastructure and team size
4. Whether you are open to an earnout or seller-financing component

Would you be available for a 30-minute call this week?

Best regards,
[Your Name]
[Your Email]

---
DRAFT ONLY — Review and personalise before sending.
Consult an immigration attorney regarding H1B passive-ownership rules before proceeding.`,
  }
}

// ─── Job application ─────────────────────────────────────────

export interface JobOutreachContext {
  jobTitle: string
  company: string | null
  salaryMax: number | null
  listingUrl: string
}

export function buildJobOutreachDraft(ctx: JobOutreachContext): {
  subject: string
  body: string
} {
  const company = ctx.company ?? 'your organisation'
  return {
    subject: `Application — ${ctx.jobTitle}${ctx.company ? ` at ${ctx.company}` : ''}`,
    body: `Hello,

I am writing to express my strong interest in the ${ctx.jobTitle} role at ${company}${ctx.salaryMax ? ` (up to ${formatMoney(ctx.salaryMax)})` : ''}.

Listing: ${ctx.listingUrl}

[Add a brief summary of your relevant experience and why this role is a strong fit.]

I would welcome the opportunity to discuss how my background aligns with your team's needs.

Best regards,
[Your Name]
[Your Email]
[LinkedIn URL]

---
DRAFT ONLY — Review and personalise before sending.`,
  }
}
