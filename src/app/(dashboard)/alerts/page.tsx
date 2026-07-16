import { Bell } from 'lucide-react'

export default function AlertsPage() {
  return (
    <div className="flex-1 p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-white heading-tighter mb-1">Updates</h1>
      <p className="text-label-secondary text-sm mb-8">
        All policy and deadline updates across your sources.
      </p>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl glass-sm shadow-apple-sm">
          <Bell size={24} className="text-label-quaternary" />
        </div>
        <p className="text-label-secondary text-sm">Full updates feed coming in Phase 6.</p>
      </div>
    </div>
  )
}
