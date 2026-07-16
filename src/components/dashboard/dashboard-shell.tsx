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
  TrendingUp,
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
  { label: 'Wealth Operator', href: '/wealth', icon: TrendingUp },
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
      <div className="flex h-full flex-col" style={{ background: '#0D0D11' }}>
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-white heading-tighter">
              Deadline<span className="text-sys-blue">IQ</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSheetOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-sys-blue/10 text-sys-blue'
                    : 'text-label-secondary hover:bg-white/[0.04] hover:text-white'
                )}
              >
                <Icon size={17} className="shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Disclaimer */}
        <div className="mx-3 mb-3 flex items-start gap-2 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(255,159,10,0.04)', border: '1px solid rgba(255,159,10,0.10)' }}>
          <Info size={11} className="mt-0.5 shrink-0" style={{ color: 'rgba(255,159,10,0.5)' }} />
          <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(235,235,245,0.28)' }}>
            Informational use only. Not legal or tax advice. Always verify with
            official sources.
          </p>
        </div>

        {/* User row */}
        <div className="px-2 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs font-semibold text-sys-blue"
                style={{ background: 'rgba(10,132,255,0.15)' }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {user.full_name && (
                <p className="text-xs font-medium text-white truncate">{user.full_name}</p>
              )}
              <p className="text-xs truncate text-label-tertiary">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="shrink-0 text-label-quaternary hover:text-label-secondary transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen app-bg">
      {/* ── Desktop sidebar ────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-col fixed inset-y-0"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ─────────────────────────── */}
      <div className="md:hidden fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between px-4"
        style={{
          background: 'rgba(13,13,17,0.90)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
        <Link href="/dashboard" className="text-lg font-bold text-white heading-tighter">
          Deadline<span className="text-sys-blue">IQ</span>
        </Link>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-label-secondary hover:text-white hover:bg-white/[0.06]"
            >
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 border-white/[0.06] bg-transparent">
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
