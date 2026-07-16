import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PushRegistration } from '@/components/dashboard/push-registration'
import { trialDaysRemaining, type BillingProfile } from '@/lib/plans'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch the extended profile from our users table
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, full_name, plan, subscription_status, trial_ends_at')
    .eq('id', user.id)
    .single()

  const userProfile = {
    id: user.id,
    email: profile?.email ?? user.email ?? '',
    full_name: profile?.full_name ?? null,
    plan: profile?.plan ?? null,
  }

  const trialDaysLeft = profile ? trialDaysRemaining(profile as BillingProfile) : null

  return (
    <DashboardShell user={userProfile} trialDaysLeft={trialDaysLeft}>
      <PushRegistration />
      {children}
    </DashboardShell>
  )
}
