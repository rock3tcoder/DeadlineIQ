'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">
              Deadline<span className="text-blue-400">IQ</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Pricing
            </a>
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Button
              asChild
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
            >
              <Link href="/signup">Start free trial</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-slate-800 py-4 space-y-3 pb-6">
            <a
              href="#how-it-works"
              className="block text-sm text-slate-400 hover:text-white py-1.5"
              onClick={() => setOpen(false)}
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="block text-sm text-slate-400 hover:text-white py-1.5"
              onClick={() => setOpen(false)}
            >
              Pricing
            </a>
            <Link
              href="/login"
              className="block text-sm text-slate-400 hover:text-white py-1.5"
            >
              Sign in
            </Link>
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-500 text-white w-full mt-2"
            >
              <Link href="/signup">Start free trial</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
