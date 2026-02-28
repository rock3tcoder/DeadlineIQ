import Stripe from 'stripe'

// Lazy singleton — only initialised when first used at request time, not at build time
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY')
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // @ts-expect-error — pinning API version string
      apiVersion: '2024-06-20',
    })
  }
  return _stripe
}

/** @deprecated Use getStripe() instead */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const PLANS = {
  starter: {
    key: 'starter' as const,
    name: 'Single Platform',
    price: '$49',
    priceMonthly: 49,
    description: 'Monitor 1 platform — Amazon, Shopify, or TikTok Shop.',
    priceId: process.env.STRIPE_PRICE_STARTER ?? '',
    features: [
      '1 platform monitored',
      'Instant email alerts',
      'Weekly digest every Monday',
      'Urgency tagging (4 levels)',
      'Direct links to official sources',
    ],
  },
  pro: {
    key: 'pro' as const,
    name: 'Multi-Platform + Federal',
    price: '$99',
    priceMonthly: 99,
    description: 'All 3 platforms plus IRS federal tax guidance.',
    priceId: process.env.STRIPE_PRICE_PRO ?? '',
    features: [
      'All 3 platforms monitored',
      'IRS federal tax updates',
      'Filing deadline reminders',
      'Instant email alerts',
      'Weekly digest every Monday',
      'Priority support',
    ],
  },
  business: {
    key: 'business' as const,
    name: 'Full Coverage',
    price: '$149',
    priceMonthly: 149,
    description: 'All platforms, federal, and 15-state sales tax monitoring.',
    priceId: process.env.STRIPE_PRICE_BUSINESS ?? '',
    features: [
      'All 3 platforms monitored',
      'IRS federal tax updates',
      'Multi-state sales tax (15 states)',
      'Filing deadline reminders',
      'Instant email alerts',
      'Weekly digest every Monday',
      'Priority support',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS
