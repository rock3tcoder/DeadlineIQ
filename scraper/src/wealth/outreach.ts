/**
 * Outreach draft generator
 *
 * Creates ready-to-send email drafts for:
 *  - Brokers (business acquisition leads)
 *  - Business owners (capital injection / equity buy-in)
 *  - Hiring managers / recruiters (job opportunities)
 *
 * Drafts are stored in the wealth_outreach table with follow-up timers.
 */

import type { WealthOpportunity } from './types.js'
import { saveOutreachDraft } from './db.js'

const SENDER_NAME = 'Ben Rubera'

// ─── Broker outreach ──────────────────────────────────────────────────────────

function buildBrokerOutreach(opp: WealthOpportunity): { subject: string; body: string } {
  const subject = `Interest in ${opp.name}`

  const financialsNote =
    opp.asking_price
      ? `I saw the asking price of $${opp.asking_price.toLocaleString()} and wanted to learn more about the financials.`
      : `I came across your listing and would like to learn more about the opportunity.`

  const body = `Hi,

I came across your listing for ${opp.name} and wanted to reach out directly.

${financialsNote}

My background is in private equity and investment banking, with experience across deal sourcing, financial modeling, and transaction execution. I'm actively looking to acquire or invest in strong cash-flowing businesses with existing management teams and scalable operations.

A few things that would be helpful:
- CIM or information memorandum
- 2–3 years of financials (P&L, revenue breakdown)
- Seller's reason for listing
- Current management / staffing structure
- Any financing seller would consider (seller note, earnout, etc.)

I can move quickly and have capital ready. Would appreciate a brief call or any materials you can share.

Best regards,
${SENDER_NAME}`

  return { subject, body }
}

// ─── Owner outreach (capital injection / equity buy-in) ───────────────────────

function buildOwnerOutreach(opp: WealthOpportunity): { subject: string; body: string } {
  const subject = `Interest in a Capital Partnership — ${opp.name}`

  const body = `Hi,

I came across ${opp.name} and understand you may be exploring growth capital or a strategic investment partner.

I'm a private equity and investment banking professional actively looking to invest in authentic operating businesses with long-term potential. I'm particularly interested in situations where the existing team continues running day-to-day operations — I'm not looking to take over operations, but rather to provide capital and strategic support as a minority investor or silent partner.

What I can offer:
- $20,000–$50,000 in equity capital (can structure as debt or equity)
- PE/IB background for financial planning, growth strategy, and exit planning
- Long-term patient capital — not looking for a quick flip
- Flexible deal structure (equity, preferred equity, convertible note, etc.)

I'd love to learn more about your business and whether there's a fit. Happy to sign an NDA and have a confidential conversation.

Best regards,
${SENDER_NAME}`

  return { subject, body }
}

// ─── Job outreach ─────────────────────────────────────────────────────────────

function buildJobOutreach(opp: WealthOpportunity): { subject: string; body: string } {
  const firmName = opp.firm_name ?? 'your firm'
  const subject = `Interest in ${opp.job_title ?? 'Investment'} Role — ${firmName}`

  const body = `Hi,

I'm currently a private equity associate with prior investment banking experience and am exploring compelling roles where I can add value immediately.

I came across the ${opp.job_title ?? 'investment'} position at ${firmName} and believe my background aligns well — including financial modeling, deal origination, due diligence, and portfolio company work.

Quick highlights:
- 2+ years in PE (deal execution, sourcing, portfolio monitoring)
- Prior IB background (M&A, LBO modeling, pitching)
- Track record across private equity, credit, and equity investments
- Strong attention to detail and ability to move fast on time-sensitive deals

I'd love to connect and learn more about the role and team. Happy to share my resume or have a quick call at your convenience.

Best regards,
${SENDER_NAME}`

  return { subject, body }
}

// ─── Follow-up draft ──────────────────────────────────────────────────────────

export function buildFollowUp(
  opp: WealthOpportunity,
  type: 'broker' | 'owner' | 'job',
  originalSubject: string
): { subject: string; body: string } {
  const subject = `Re: ${originalSubject}`

  const body =
    type === 'job'
      ? `Hi,

Just wanted to follow up on my earlier note regarding the ${opp.job_title ?? 'investment'} role at ${opp.firm_name ?? 'your firm'}.

Still very interested — happy to chat at your convenience or provide any additional materials.

Best,
${SENDER_NAME}`
      : `Hi,

Just following up on my earlier message about ${opp.name}.

I remain interested and can move quickly if you have materials available. Happy to jump on a quick call this week.

Best,
${SENDER_NAME}`

  return { subject, body }
}

// ─── Main export: generate + save outreach draft ──────────────────────────────

export async function generateOutreach(opp: WealthOpportunity): Promise<void> {
  let draft: { subject: string; body: string }
  let outreachType: 'broker' | 'owner' | 'job'

  if (opp.opportunity_type === 'job') {
    draft = buildJobOutreach(opp)
    outreachType = 'job'
  } else if (opp.opportunity_type === 'capital_injection') {
    draft = buildOwnerOutreach(opp)
    outreachType = 'owner'
  } else {
    draft = buildBrokerOutreach(opp)
    outreachType = 'broker'
  }

  // Set follow-up reminder 3 business days out (~4.3 calendar days)
  const followUpAt = new Date(Date.now() + 4.3 * 24 * 60 * 60 * 1000).toISOString()

  await saveOutreachDraft({
    opportunity_id: opp.id,
    outreach_type: outreachType,
    subject: draft.subject,
    body: draft.body,
    follow_up_due_at: followUpAt,
  })

  console.log(`  [outreach] Draft saved for "${opp.name}" (${outreachType})`)
}
