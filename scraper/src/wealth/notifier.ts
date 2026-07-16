// Sends notification emails to the owner (WEALTH_ALERT_EMAIL) whenever a
// new opportunity is discovered. Each notification includes the full draft
// outreach text inline so the owner can copy-paste and send manually.
//
// The notification itself IS sent via Resend; the OUTREACH draft embedded
// inside is NOT — it is purely informational text for the owner to use.

import { Resend } from 'resend'
import {
  buildBusinessOutreachDraft,
  buildCapitalOutreachDraft,
  buildJobOutreachDraft,
} from './outreach.js'
import { recordAlert } from './db.js'
import type { ScrapedBusiness } from './bizbuysell.js'
import type { ScrapedCapital } from './capital.js'
import type { ScrapedJob } from './jobs.js'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.RESEND_FROM_EMAIL ?? 'alerts@deadlineiq.com'
const ALERT_TO = process.env.WEALTH_ALERT_EMAIL ?? FROM
const APP_URL = process.env.APP_URL ?? 'https://deadlineiq.com'

function formatMoney(cents: number | null): string {
  if (cents === null) return 'N/A'
  const d = cents / 100
  if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}M`
  if (d >= 1_000) return `$${(d / 1_000).toFixed(0)}K`
  return `$${d.toFixed(0)}`
}

function escapedDraft(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// ─── Shared layout pieces ─────────────────────────────────────

function header(subtitle: string): string {
  return `
    <tr><td style="padding-bottom:20px">
      <span style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-.3px">Deadline<span style="color:#3b82f6">IQ</span></span>
      <span style="margin-left:12px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em">${subtitle}</span>
    </td></tr>`
}

function draftBox(draft: { subject: string; body: string }): string {
  return `
    <tr><td style="padding-top:24px">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#cbd5e1">Draft outreach — copy, personalise, then send manually:</p>
      <p style="margin:0 0 4px;font-size:11px;color:#64748b"><strong>Subject:</strong> ${draft.subject}</p>
      <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:16px;font-family:'Courier New',monospace;font-size:12px;color:#94a3b8;white-space:pre-wrap;line-height:1.6">${escapedDraft(draft.body)}</div>
    </td></tr>`
}

function footer(note: string): string {
  return `
    <tr><td style="padding-top:16px">
      <p style="margin:0;font-size:11px;color:#475569;line-height:1.5">${note}</p>
    </td></tr>`
}

function tableRow(label: string, value: string, isLast = false): string {
  const border = isLast ? '' : 'border-bottom:1px solid #334155;'
  return `
    <tr>
      <td style="padding:8px 16px 8px 0;${border}font-size:12px;color:#64748b;width:40%">${label}</td>
      <td style="padding:8px 0;${border}font-size:14px;font-weight:600;color:#f1f5f9">${value}</td>
    </tr>`
}

function wrapEmail(bodyRows: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
${bodyRows}
</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── Business notification ────────────────────────────────────

function buildBusinessHtml(b: ScrapedBusiness, draft: { subject: string; body: string }): string {
  const l = b.listing
  const passiveBadge = l.is_passive_eligible
    ? `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:#166534;color:#dcfce7;margin-left:8px">Passive-eligible</span>`
    : ''

  const rows = `
    ${header('Wealth Operator')}
    <tr><td style="background:#1e293b;border-radius:12px;padding:28px 32px;border:1px solid #334155">
      <p style="margin:0 0 6px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Business for Sale · ${l.source}</p>
      <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#f1f5f9">${l.title}${passiveBadge}</h1>
      ${l.location ? `<p style="margin:4px 0 16px;font-size:13px;color:#94a3b8">${l.location}</p>` : '<div style="margin-bottom:16px"></div>'}
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px">
        ${tableRow('Asking Price', formatMoney(l.asking_price_cents))}
        ${tableRow('Cash Flow', formatMoney(l.cash_flow_cents))}
        ${tableRow('Revenue', formatMoney(l.revenue_cents), true)}
      </table>
      ${l.description ? `<p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.6">${l.description.slice(0, 300)}${l.description.length > 300 ? '…' : ''}</p>` : ''}
      <a href="${l.listing_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;margin-right:8px">View Listing</a>
      <a href="${APP_URL}/wealth" style="display:inline-block;padding:10px 20px;border:1px solid #334155;color:#94a3b8;text-decoration:none;border-radius:8px;font-size:14px">Dashboard</a>
    </td></tr>
    ${draftBox(draft)}
    ${footer('This alert is for your personal use only. All outreach is drafted — never sent automatically. Consult an immigration attorney before acquiring any business (H1B considerations).')}`

  return wrapEmail(rows)
}

// ─── Capital notification ─────────────────────────────────────

function buildCapitalHtml(c: ScrapedCapital, draft: { subject: string; body: string }): string {
  const opp = c.opportunity

  const rows = `
    ${header('Wealth Operator')}
    <tr><td style="background:#1e293b;border-radius:12px;padding:28px 32px;border:1px solid #334155">
      <p style="margin:0 0 6px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Capital / Equity Opportunity · ${opp.source}</p>
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f1f5f9">${opp.company_name}</h1>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px">
        ${tableRow('Amount Seeking', formatMoney(opp.amount_seeking_cents))}
        ${opp.industry ? tableRow('Industry', opp.industry) : ''}
        ${tableRow('Location', opp.location ?? 'Remote', true)}
      </table>
      ${opp.description ? `<p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.6">${opp.description.slice(0, 300)}${opp.description.length > 300 ? '…' : ''}</p>` : ''}
      <a href="${opp.listing_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;margin-right:8px">View Listing</a>
      <a href="${APP_URL}/wealth" style="display:inline-block;padding:10px 20px;border:1px solid #334155;color:#94a3b8;text-decoration:none;border-radius:8px;font-size:14px">Dashboard</a>
    </td></tr>
    ${draftBox(draft)}
    ${footer('This alert is for your personal use only. Outreach is drafted — never sent automatically. Consult an immigration attorney before making any investment (H1B considerations).')}`

  return wrapEmail(rows)
}

// ─── Job notification ─────────────────────────────────────────

function buildJobHtml(j: ScrapedJob, draft: { subject: string; body: string }): string {
  const job = j.job
  const salMin = formatMoney(job.salary_min_cents)
  const salMax = formatMoney(job.salary_max_cents)
  const salRange =
    job.salary_min_cents && job.salary_max_cents
      ? `${salMin}–${salMax}`
      : job.salary_max_cents
        ? `up to ${salMax}`
        : 'Undisclosed'

  const rows = `
    ${header('Wealth Operator')}
    <tr><td style="background:#1e293b;border-radius:12px;padding:28px 32px;border:1px solid #334155">
      <p style="margin:0 0 6px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Job · ${job.source}</p>
      <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#f1f5f9">${job.job_title}</h1>
      ${job.company ? `<p style="margin:0 0 16px;font-size:15px;color:#94a3b8">${job.company}</p>` : '<div style="margin-bottom:16px"></div>'}
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px">
        ${tableRow('Salary', `<span style="color:#22c55e">${salRange}</span>`)}
        ${tableRow('Location', job.location ?? 'New York, NY', true)}
      </table>
      <a href="${job.listing_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;margin-right:8px">View Job</a>
      <a href="${APP_URL}/wealth" style="display:inline-block;padding:10px 20px;border:1px solid #334155;color:#94a3b8;text-decoration:none;border-radius:8px;font-size:14px">Dashboard</a>
    </td></tr>
    ${draftBox(draft)}
    ${footer('This alert is for your personal use only. Application drafts are never sent automatically.')}`

  return wrapEmail(rows)
}

// ─── Public send functions ────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string, label: string): Promise<void> {
  if (!resend) {
    console.log(`  [notify] Skipped (no RESEND_API_KEY) — ${label}`)
    return
  }

  const { error } = await resend.emails.send({ from: FROM, to, subject, html })

  if (error) {
    console.error(`  [notify] Email failed for ${label}:`, error.message)
  } else {
    console.log(`  [notify] Alert sent to ${to} — ${label}`)
  }
}

export async function notifyBusiness(b: ScrapedBusiness): Promise<void> {
  const draft = buildBusinessOutreachDraft({
    businessTitle: b.listing.title,
    askingPrice: b.listing.asking_price_cents,
    cashFlow: b.listing.cash_flow_cents,
    location: b.listing.location,
    listingUrl: b.listing.listing_url,
  })

  await recordAlert('business', b.id, draft.subject, draft.body)
  await sendEmail(
    ALERT_TO,
    `[Wealth] New business for sale: ${b.listing.title}`,
    buildBusinessHtml(b, draft),
    b.listing.title
  )
}

export async function notifyCapital(c: ScrapedCapital): Promise<void> {
  const draft = buildCapitalOutreachDraft({
    companyName: c.opportunity.company_name,
    amountSeeking: c.opportunity.amount_seeking_cents,
    industry: c.opportunity.industry,
    listingUrl: c.opportunity.listing_url,
  })

  await recordAlert('capital', c.id, draft.subject, draft.body)
  await sendEmail(
    ALERT_TO,
    `[Wealth] New investment opportunity: ${c.opportunity.company_name}`,
    buildCapitalHtml(c, draft),
    c.opportunity.company_name
  )
}

export async function notifyJob(j: ScrapedJob): Promise<void> {
  const draft = buildJobOutreachDraft({
    jobTitle: j.job.job_title,
    company: j.job.company,
    salaryMax: j.job.salary_max_cents,
    listingUrl: j.job.listing_url,
  })

  await recordAlert('job', j.id, draft.subject, draft.body)
  await sendEmail(
    ALERT_TO,
    `[Wealth] $250k+ job: ${j.job.job_title}${j.job.company ? ` at ${j.job.company}` : ''}`,
    buildJobHtml(j, draft),
    j.job.job_title
  )
}
