'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Bell,
  Globe,
  Settings,
  LogOut,
  Menu,
  CreditCard,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Updates', href: '/alerts', icon: Bell },
  { label: 'My Sources', href: '/markets', icon: Globe },
  { label: 'Billing', href: '/settings/billing', icon: CreditCard },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  plan: string | null
}

interface DashboardShellProps {
  user: UserProfile
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = user.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (user.email?.slice(0, 2).toUpperCase() ?? 'U')

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  function SidebarContent() {
    return (
      <div className="flex h-full flex-col bg-slate-900">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-white tracking-tight">
              Deadline<span className="text-blue-400">IQ</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSheetOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive(href)
                  ? 'bg-blue-600/15 text-blue-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon size={17} className="shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Disclaimer */}
        <div className="mx-3 mb-3 flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2.5">
          <Info size={12} className="mt-0.5 shrink-0 text-amber-500/60" />
          <p className="text-[10px] leading-relaxed text-amber-200/40">
            Informational use only. Not legal or tax advice. Always verify with
            official sources.
          </p>
        </div>

        {/* User row */}
        <div className="border-t border-slate-800 px-3 py-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-blue-600/20 text-blue-400 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {user.full_name && (
                <p className="text-xs font-medium text-white truncate">{user.full_name}</p>
              )}
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* ── Desktop sidebar ────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-col fixed inset-y-0 border-r border-slate-800">
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ─────────────────────────── */}
      <div className="md:hidden fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4">
        <Link href="/dashboard" className="text-lg font-bold text-white tracking-tight">
          Deadline<span className="text-blue-400">IQ</span>
        </Link>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 border-slate-800">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Main content ───────────────────────────── */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  )
}
