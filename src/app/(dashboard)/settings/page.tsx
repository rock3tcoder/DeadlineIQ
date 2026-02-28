import { redirect } from 'next/navigation'

// /settings redirects to /settings/billing
export default function SettingsPage() {
  redirect('/settings/billing')
}
