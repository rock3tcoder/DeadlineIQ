// Full updates feed — built in Phase 6
import { Bell } from 'lucide-react'

export default function AlertsPage() {
  return (
    <div className="flex-1 p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Updates</h1>
      <p className="text-slate-400 text-sm mb-8">All policy and deadline updates across your sources.</p>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-20 text-center">
        <Bell size={28} className="text-slate-600 mb-4" />
        <p className="text-slate-400 text-sm">Full updates feed coming in Phase 6.</p>
      </div>
    </div>
  )
}
