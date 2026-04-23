/**
 * Wealth Operator Notifier
 *
 * Sends instant email alerts for A+ and A deals via Resend.
 *
 * Env vars required:
 *  WEALTH_ALERT_EMAIL  — recipient email (default: benrubera1@gmail.com)
 *  RESEND_API_KEY      — Resend API key
 *  RESEND_FROM_EMAIL   — from address (default: alerts@deadlineiq.com)
 */

import { Resend } from 'resend'
import type { WealthOpportunity } from './types.js'

// ─── Config ───────────────────────────────────────────────────────────────────

const ALERT_EMAIL = process.env.WEALTH_ALERT_EMAIL ?? 'benrubera1@gmail.com'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'alerts@deadlineiq.com'
const APP_URL = process.env.APP_URL ?? 'https://deadlineiq.com'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// ─── Grade badge colors ───────────────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
  'A+': '#10b981', // emerald
  'A':  '#3b82f6', // blue
  'B':  '#f59e0b', // amber
  'C':  '#64748b', // slate
}

const TYPE_LABEL: Record<string, string> = {
  acquisition:       'Business Acquisition',
  capital_injection: 'Capital Injection / Equity Buy-In',
  job:               'NYC Job Opportunity',
}

// ─── Email HTML builder ───────────────────────────────────────────────────────

function buildAlertEmail(opp: WealthOpportunity): string {
  const gradeColor = GRADE_COLOR[opp.grade ?? 'B'] ?? '#64748b'
  const typeLabel = TYPE_LABEL[opp.opportunity_type] ?? opp.opportunity_type

  const financialsHtml =
    opp.opportunity_type !== 'job'
      ? `
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          ${opp.asking_price ? `<tr><td style="padding:6px 0;color:#94a3b8;font-size:13px;width:160px">Asking Price</td><td style="padding:6px 0;color:#f1f5f9;font-size:13px;font-weight:600">$${opp.asking_price.toLocaleString()}</td></tr>` : ''}
          ${opp.cash_flow_annual ? `<tr><td style="padding:6px 0;color:#94a3b8;font-size:13px">Annual Cash Flow</td><td style="padding:6px 0;color:#10b981;font-size:13px;font-weight:600">$${opp.cash_flow_annual.toLocaleString()}</td></tr>` : ''}
          ${opp.revenue_annual ? `<tr><td style="padding:6px 0;color:#94a3b8;font-size:13px">Annual Revenue</td><td style="padding:6px 0;color:#f1f5f9;font-size:13px">$${opp.revenue_annual.toLocaleString()}</td></tr>` : ''}
          ${opp.equity_needed ? `<tr><td style="padding:6px 0;color:#94a3b8;font-size:13px">Equity Needed</td><td style="padding:6px 0;color:#f59e0b;font-size:13px;font-weight:600">$${opp.equity_needed.toLocaleString()}</td></tr>` : ''}
          ${opp.cash_on_cash_return ? `<tr><td style="padding:6px 0;color:#94a3b8;font-size:13px">Cash-on-Cash Return</td><td style="padding:6px 0;color:#10b981;font-size:13px;font-weight:600">${opp.cash_on_cash_return.toFixed(1)}%</td></tr>` : ''}
          ${opp.risk_score ? `<tr><td style="padding:6px 0;color:#94a3b8;font-size:13px">Risk Score</td><td style="padding:6px 0;color:#f1f5f9;font-size:13px">${opp.risk_score}/10</td></tr>` : ''}
          ${opp.passive_possible !== undefined ? `<tr><td style="padding:6px 0;color:#94a3b8;font-size:13px">Passive Ownership</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:${opp.passive_possible ? '#10b981' : '#ef4444'}">${opp.passive_possible ? 'YES ✓' : 'NO — Review H1B'}</td></tr>` : ''}
        </table>`
      : `
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          ${opp.estimated_comp_low && opp.estimated_comp_high ? `<tr><td style="padding:6px 0;color:#94a3b8;font-size:13px;width:160px">Estimated Comp</td><td style="padding:6px 0;color:#10b981;font-size:13px;font-weight:600">$${opp.estimated_comp_low.toLocaleString()} – $${opp.estimated_comp_high.toLocaleString()}</td></tr>` : ''}
          ${opp.fit_score ? `<tr><td style="padding:6px 0;color:#94a3b8;font-size:13px">Fit Score</td><td style="padding:6px 0;color:#f1f5f9;font-size:13px">${opp.fit_score}/10</td></tr>` : ''}
          ${opp.difficulty_score ? `<tr><td style="padding:6px 0;color:#94a3b8;font-size:13px">Difficulty</td><td style="padding:6px 0;color:#f1f5f9;font-size:13px">${opp.difficulty_score}/10</td></tr>` : ''}
          ${opp.warm_outreach !== undefined ? `<tr><td style="padding:6px 0;color:#94a3b8;font-size:13px">Warm Outreach?</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:${opp.warm_outreach ? '#f59e0b' : '#64748b'}">${opp.warm_outreach ? 'YES — Get intro' : 'Cold outreach OK'}</td></tr>` : ''}
        </table>`

  const actionItemsHtml =
    opp.ai_action_items && opp.ai_action_items.length > 0
      ? `<div style="margin-top:16px">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#cbd5e1;text-transform:uppercase;letter-spacing:.05em">Next Steps</p>
          <ul style="margin:0;padding-left:18px">
            ${opp.ai_action_items.map((a) => `<li style="margin-bottom:5px;color:#94a3b8;font-size:13px;line-height:1.5">${a}</li>`).join('')}
          </ul>
        </div>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wealth Alert: ${opp.grade} — ${opp.name}</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Logo -->
        <tr><td style="padding-bottom:20px">
          <span style="font-size:16px;font-weight:700;color:#fff">Deadline<span style="color:#3b82f6">IQ</span></span>
          <span style="margin-left:12px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Wealth Operator</span>
        </td></tr>

        <!-- Alert header -->
        <tr><td style="background:#1e293b;border-radius:12px 12px 0 0;padding:20px 28px;border:1px solid #334155;border-bottom:none">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
            <span style="display:inline-block;padding:4px 14px;border-radius:999px;font-size:13px;font-weight:700;color:#fff;background:${gradeColor};letter-spacing:.02em">Grade ${opp.grade}</span>
            <span style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em">${typeLabel}</span>
          </div>
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#f1f5f9;line-height:1.2">${opp.name}</h1>
          <p style="margin:0;font-size:13px;color:#64748b">${opp.location} · ${opp.source_platform}</p>
        </td></tr>

        <!-- Body card -->
        <tr><td style="background:#1e293b;padding:0 28px 24px;border:1px solid #334155;border-top:none;border-radius:0 0 12px 12px">

          <!-- Summary -->
          <p style="margin:16px 0 0;font-size:14px;color:#cbd5e1;line-height:1.7">${opp.ai_summary ?? opp.description}</p>

          <!-- Financials table -->
          ${financialsHtml}

          <!-- Rationale -->
          ${opp.ai_rationale ? `<div style="margin-top:16px;padding:12px 14px;background:#0f172a;border-radius:8px;border-left:3px solid ${gradeColor}"><p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6">${opp.ai_rationale}</p></div>` : ''}

          <!-- Risks -->
          ${opp.ai_risks ? `<p style="margin:14px 0 0;font-size:12px;color:#ef4444"><strong>Risks:</strong> ${opp.ai_risks}</p>` : ''}

          <!-- Action items -->
          ${actionItemsHtml}

          <!-- Next step -->
          ${opp.ai_next_step ? `<div style="margin-top:16px;padding:12px 14px;background:#10b981/10;border-radius:8px;border:1px solid #10b981/20"><p style="margin:0;font-size:13px;font-weight:600;color:#10b981">→ ${opp.ai_next_step}</p></div>` : ''}

          <!-- CTAs -->
          <div style="margin-top:24px;display:flex;gap:10px">
            ${opp.source_url ? `<a href="${opp.source_url}" style="display:inline-block;padding:10px 20px;background:${gradeColor};color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;margin-right:10px">View Listing →</a>` : ''}
            <a href="${APP_URL}/wealth" style="display:inline-block;padding:10px 20px;background:#1e293b;border:1px solid #334155;color:#94a3b8;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">Open Wealth Dashboard</a>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 0 0">
          <p style="margin:0;font-size:11px;color:#475569;line-height:1.5">
            Sent by your DeadlineIQ Wealth Operator. Always consult legal counsel before closing any transaction.
            H1B compliance review required before acquiring or investing in any business.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Main export — send instant alert for A+ and A opportunities ──────────────

export async function sendInstantWealthAlert(opp: WealthOpportunity): Promise<void> {
  if (!opp.grade || !['A+', 'A'].includes(opp.grade)) return

  const typeLabel = TYPE_LABEL[opp.opportunity_type] ?? opp.opportunity_type
  const subject = `[${opp.grade}] ${typeLabel}: ${opp.name}`

  // 1. Email
  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: ALERT_EMAIL,
        subject,
        html: buildAlertEmail(opp),
      })
      if (error) {
        console.error('  [notifier] Email failed:', error.message)
      } else {
        console.log(`  [notifier] Email alert sent — ${opp.grade}: ${opp.name}`)
      }
    } catch (err) {
      console.error('  [notifier] Email error:', err instanceof Error ? err.message : err)
    }
  } else {
    console.log('  [notifier] Email skipped — RESEND_API_KEY not set')
  }
}
