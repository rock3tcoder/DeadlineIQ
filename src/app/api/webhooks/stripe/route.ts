import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

// Stripe sends the raw body — Next.js must NOT parse it
export const runtime = 'nodejs'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

async function upsertSubscription(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  subscription: Stripe.Subscription,
) {
  const userId = subscription.metadata?.supabase_user_id
  if (!userId) return

  const plan = (subscription.metadata?.plan ?? 'starter') as string
  const status = subscription.status // 'active' | 'trialing' | 'past_due' | 'canceled' | etc.

  await supabase
    .from('users')
    .update({
      plan,
      subscription_status: status,
      stripe_subscription_id: subscription.id,
    })
    .eq('id', userId)
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      // Subscription is created by Stripe after checkout — the subscription.* events below will handle DB update.
      // But if sub exists on session, also handle it here for faster propagation.
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        await upsertSubscription(supabase, sub)
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await upsertSubscription(supabase, subscription)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.supabase_user_id
      if (userId) {
        await supabase
          .from('users')
          .update({
            plan: null,
            subscription_status: 'canceled',
            stripe_subscription_id: null,
          })
          .eq('id', userId)
      }
      break
    }

    case 'invoice.payment_failed': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoice = event.data.object as any
      const subscriptionId = invoice.subscription ?? invoice.parent?.subscription_details?.subscription
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId as string)
        await upsertSubscription(supabase, sub)
      }
      break
    }

    default:
      // Unhandled event type — ignore
      break
  }

  return NextResponse.json({ received: true })
}
