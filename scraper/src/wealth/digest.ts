/**
 * Daily Wealth Digest
 *
 * Sends a morning summary email every day with:
 *  Section 1: Best Businesses to Buy (A+ and A acquisitions)
 *  Section 2: Best Capital Injection Deals
 *  Section 3: Best NYC Jobs
 *  Section 4: Outreach Queue (drafts ready to send)
 *  Section 5: Highest ROI Move Today
 *  Section 6: What You Should Do Today
 */

import { Resend } from 'resend'
import type { WealthOpportunity } from './types.js'
import { fetchDigestOpportunities, logDigest } from './db.js'

const ALERT_EMAIL = process.env.WEALTH_ALERT_EMAIL ?? 'benrubera1@gmail.com'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'alerts@deadlineiq.com'
const APP_URL = process.env.APP_URL ?? 'https://deadlineiq.com'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// ─── HTML helpers ─────────────────────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
  'A+': '#10b981',
  'A':  '#3b82f6',
  'B':  '#f59e0b',
  'C':  '#64748b',
}

function gradeBadge(grade: string): string {
  const color = GRADE_COLOR[grade] ?? '#64748b'
  return `<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:700;color:#fff;background:${color}">${grade}</span>`
}

function opportunityRow(opp: WealthOpportunity): string {
  const mainMetric =
    opp.opportunity_type === 'job'
      ? `$${opp.estimated_comp_low?.toLocaleString() ?? '?'}–$${opp.estimated_comp_high?.toLocaleString() ?? '?'} comp`
      : opp.cash_flow_annual
        ? `$${opp.cash_flow_annual.toLocaleString()} CF/yr`
        : opp.asking_price
          ? `$${opp.asking_price.toLocaleString()} ask`
          : 'CF TBD'

  const secondaryMetric =
    opp.opportunity_type === 'job'
      ? `Fit: ${opp.fit_score ?? '?'}/10`
      : opp.cash_on_cash_return
        ? `${opp.cash_on_cash_return.toFixed(0)}% CoC`
        : opp.equity_needed
          ? `$${opp.equity_needed.toLocaleString()} equity`
          : ''

  return `<tr>
    <td style="padding:14px 0;border-bottom:1px solid #1e293b;vertical-align:top">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div style="flex:1">
          ${gradeBadge(opp.grade ?? 'B')}
          <p style="margin:6px 0 2px;font-size:14px;font-weight:600;color:#f1f5f9">${opp.name}</p>
          <p style="margin:0;font-size:12px;color:#64748b">${opp.location} · ${opp.source_platform}</p>
          ${opp.ai_summary ? `<p style="margin:6px 0 0;font-size:12px;color:#94a3b8;line-height:1.5">${opp.ai_summary.slice(0, 180)}…</p>` : ''}
          <div style="margin-top:6px;display:flex;align-items:center;gap:12px">
            <span style="font-size:12px;color:#10b981;font-weight:600">${mainMetric}</span>
            ${secondaryMetric ? `<span style="font-size:12px;color:#94a3b8">${secondaryMetric}</span>` : ''}
            ${opp.source_url ? `<a href="${opp.source_url}" style="font-size:11px;color:#3b82f6;text-decoration:none">View →</a>` : ''}
          </div>
        </div>
      </div>
    </td>
  </tr>`
}

function sectionHeader(title: string, count: number, emoji: string): string {
  return `<tr><td style="padding:28px 0 10px">
    <p style="margin:0;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em">${emoji} ${title} (${count})</p>
  </td></tr>`
}

function emptySection(msg: string): string {
  return `<tr><td style="padding:10px 0 20px">
    <p style="margin:0;font-size:13px;color:#475569;font-style:italic">${msg}</p>
  </td></tr>`
}

// ─── Build digest HTML ────────────────────────────────────────────────────────

function buildDigestHtml(
  acquisitions: WealthOpportunity[],
  capitalDeals: WealthOpportunity[],
  jobs: WealthOpportunity[],
  topMove: string,
  todayActions: string[]
): string {
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const totalCount = acquisitions.length + capitalDeals.length + jobs.length
  const aPlusCount = [...acquisitions, ...capitalDeals, ...jobs].filter((o) => o.grade === 'A+').length

  const acqRows = acquisitions.length > 0
    ? acquisitions.map(opportunityRow).join('')
    : emptySection('No strong acquisition opportunities found in the past 24 hours.')

  const capRows = capitalDeals.length > 0
    ? capitalDeals.map(opportunityRow).join('')
    : emptySection('No capital injection opportunities found in the past 24 hours.')

  const jobRows = jobs.length > 0
    ? jobs.map(opportunityRow).join('')
    : emptySection('No high-comp NYC roles found in the past 24 hours.')

  const todayListHtml = todayActions
    .map((a, i) => `<li style="margin-bottom:8px;color:#cbd5e1;font-size:14px;line-height:1.5"><strong>${i + 1}.</strong> ${a}</li>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wealth Digest — ${dateStr}</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%">

        <!-- Header -->
        <tr><td style="padding-bottom:24px">
          <span style="font-size:18px;font-weight:700;color:#fff">Deadline<span style="color:#3b82f6">IQ</span></span>
          <span style="margin-left:10px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Wealth Operator</span>
          <h2 style="margin:16px 0 4px;font-size:24px;font-weight:700;color:#f1f5f9">Daily Wealth Pipeline</h2>
          <p style="margin:0;font-size:13px;color:#64748b">${dateStr} · ${totalCount} opportunities · ${aPlusCount} rated A+</p>
        </td></tr>

        <!-- Today's ROI Move -->
        <tr><td style="background:#0f4c35;border-radius:12px;padding:20px 24px;border:1px solid #10b981/30;margin-bottom:24px">
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#10b981;text-transform:uppercase;letter-spacing:.08em">🎯 Highest ROI Move Today</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#ecfdf5;line-height:1.5">${topMove}</p>
        </td></tr>

        <tr><td style="padding-top:8px"></td></tr>

        <!-- Main content card -->
        <tr><td style="background:#1e293b;border-radius:12px;padding:4px 28px 20px;border:1px solid #334155">
          <table width="100%" cellpadding="0" cellspacing="0">

            <!-- Section 1: Acquisitions -->
            ${sectionHeader('Businesses to Buy', acquisitions.length, '🏢')}
            ${acqRows}

            <!-- Section 2: Capital Injection -->
            ${sectionHeader('Capital Injection / Equity Buy-In', capitalDeals.length, '💰')}
            ${capRows}

            <!-- Section 3: NYC Jobs -->
            ${sectionHeader('NYC Jobs $250k+', jobs.length, '💼')}
            ${jobRows}

          </table>
        </td></tr>

        <!-- Section 6: What to do today -->
        <tr><td style="background:#1e293b;border-radius:12px;padding:20px 28px;border:1px solid #334155;margin-top:16px">
          <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em">📋 What You Should Do Today</p>
          <ul style="margin:0;padding-left:4px;list-style:none">
            ${todayListHtml}
          </ul>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:20px 0 0;text-align:center">
          <a href="${APP_URL}/wealth" style="display:inline-block;padding:12px 28px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Open Wealth Dashboard →</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 0 0">
          <p style="margin:0;font-size:11px;color:#475569;line-height:1.5;text-align:center">
            Always consult legal counsel and an immigration attorney before closing any transaction.
            H1B compliance review required before acquiring or investing in any business.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Generate "what to do today" list ────────────────────────────────────────

function generateTodayActions(
  acquisitions: WealthOpportunity[],
  capitalDeals: WealthOpportunity[],
  jobs: WealthOpportunity[]
): { topMove: string; actions: string[] } {
  const actions: string[] = []
  const allOpps = [...acquisitions, ...capitalDeals, ...jobs]
  const aPlus = allOpps.filter((o) => o.grade === 'A+')
  const aGrade = allOpps.filter((o) => o.grade === 'A')

  if (aPlus.length > 0) {
    const top = aPlus[0]
    actions.push(`Contact broker/owner on A+ deal: "${top.name}" — ${top.ai_next_step ?? 'request CIM and financials'}`)
  }
  if (aPlus.length > 1) {
    actions.push(`Follow up on second A+ opportunity: "${aPlus[1].name}"`)
  }
  if (aGrade.length > 0) {
    actions.push(`Review A-grade opportunities on the dashboard and send outreach drafts`)
  }

  const topJob = jobs.find((j) => j.grade === 'A+' || j.grade === 'A')
  if (topJob) {
    actions.push(`Apply / warm outreach for: ${topJob.firm_name ?? topJob.name} — ${topJob.job_title ?? 'investment role'}`)
  }

  if (actions.length < 3) {
    actions.push('Review new listings on BizBuySell and Empire Flippers manually')
    actions.push('Network — post LinkedIn update about your investing thesis to generate inbound deal flow')
    actions.push('Set Google Alert: "silent partner wanted New York" + "investor wanted NJ"')
  }

  const topMove =
    aPlus.length > 0
      ? `Contact broker for "${aPlus[0].name}" immediately — this is your strongest opportunity today`
      : aGrade.length > 0
        ? `Review and send outreach for "${aGrade[0].name}" — your best A-grade opportunity`
        : topJob
          ? `Apply to ${topJob.firm_name ?? 'top job'} — your strongest income opportunity today`
          : 'Expand search filters and check BizBuySell manually for new listings'

  return { topMove, actions: actions.slice(0, 6) }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function sendWealthDigest(): Promise<void> {
  if (!resend) {
    console.log('[wealth:digest] Skipped — RESEND_API_KEY not configured')
    return
  }

  console.log('\n[wealth:digest] Preparing daily wealth digest...')

  // Pull last 24 hours of opportunities
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const all = await fetchDigestOpportunities(since)

  const acquisitions = all.filter((o) => o.opportunity_type === 'acquisition')
  const capitalDeals = all.filter((o) => o.opportunity_type === 'capital_injection')
  const jobs = all.filter((o) => o.opportunity_type === 'job')

  console.log(
    `  → ${acquisitions.length} acquisitions, ${capitalDeals.length} capital deals, ${jobs.length} jobs`
  )

  const { topMove, actions } = generateTodayActions(acquisitions, capitalDeals, jobs)
  const html = buildDigestHtml(acquisitions, capitalDeals, jobs, topMove, actions)

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const aPlus = all.filter((o) => o.grade === 'A+').length
  const subject = `Wealth Digest ${dateStr} — ${all.length} opportunities${aPlus > 0 ? `, ${aPlus} A+` : ''}`

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: ALERT_EMAIL,
    subject,
    html,
  })

  if (error) {
    console.error('[wealth:digest] Email failed:', error.message)
    return
  }

  console.log(`[wealth:digest] Digest sent to ${ALERT_EMAIL} — ${all.length} opportunities`)

  await logDigest({
    recipient_email: ALERT_EMAIL,
    subject,
    total_opps: all.length,
    a_plus_count: all.filter((o) => o.grade === 'A+').length,
    a_count: all.filter((o) => o.grade === 'A').length,
    b_count: all.filter((o) => o.grade === 'B').length,
  })
}
