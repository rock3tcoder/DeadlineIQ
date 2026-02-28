import Link from 'next/link'
import { PLATFORM_DISCLAIMER } from '@/types'

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <span className="text-lg font-bold text-white">
              Deadline<span className="text-blue-400">IQ</span>
            </span>
            <p className="mt-3 text-sm text-slate-400 max-w-xs">
              Automated Regulatory &amp; Policy Update Intelligence Platform for
              e-commerce sellers, SMBs, and accounting firms.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#how-it-works"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Start free trial
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Mandatory disclaimer */}
        <div className="mt-10 rounded-lg border border-amber-500/15 bg-amber-500/5 px-5 py-4">
          <p className="text-xs text-amber-200/60 leading-relaxed">
            <span className="font-semibold text-amber-200/80">Informational use only. </span>
            {PLATFORM_DISCLAIMER}
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-6">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} DeadlineIQ. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
