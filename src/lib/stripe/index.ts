import Stripe from 'stripe'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
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
