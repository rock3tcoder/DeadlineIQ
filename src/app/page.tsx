import Link from 'next/link'
import { Nav } from '@/components/marketing/nav'
import { Footer } from '@/components/marketing/footer'
import { Button } from '@/components/ui/button'
import { PLATFORM_DISCLAIMER } from '@/types'
import {
  Bell,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Globe,
  Info,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react'

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 pt-16">
      {/* Glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-2/3 left-1/4 h-[300px] w-[500px] rounded-full bg-indigo-700/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300">
          <Zap size={14} className="fill-blue-400 text-blue-400" />
          14-day free trial — no credit card required
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
          Policy Changes.
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-indigo-400 bg-clip-text text-transparent">
            Tax Deadlines.
          </span>
          <br />
          Always in Your Inbox.
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-slate-400 leading-relaxed">
          Automated monitoring of Amazon, Shopify, TikTok Shop, IRS, and state tax
          authorities. Get plain-English summaries of official updates — before they
          affect your business.
        </p>

        {/* Target audience chips */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['Amazon Sellers', 'Shopify Brands', 'TikTok Shop', 'SMBs', 'Accounting Firms'].map(
            (tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-400"
              >
                {tag}
              </span>
            )
          )}
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 shadow-xl shadow-blue-600/30 text-base h-12"
          >
            <Link href="/signup">Start free trial →</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white px-8 text-base h-12"
          >
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>

        <p className="mt-4 text-xs text-slate-600">
          No credit card required &middot; Cancel anytime &middot; Setup in under 2 minutes
        </p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// STATS BAR
// ─────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { icon: Globe, label: '20+ Sources monitored' },
    { icon: Clock, label: 'Checked every 6 hours' },
    { icon: ShieldCheck, label: 'AI-powered summaries' },
    { icon: Bell, label: 'Deadline reminders' },
  ]

  return (
    <section className="border-y border-slate-800 bg-slate-900/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-slate-800">
          {stats.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center justify-center gap-3 text-center md:text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                <Icon size={18} className="text-blue-400" />
              </div>
              <span className="text-sm font-medium text-slate-300">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      icon: Search,
      step: '01',
      title: 'Choose your sources',
      description:
        'Select the platforms and tax jurisdictions relevant to your business — Amazon, Shopify, TikTok Shop, IRS federal, or specific state tax authorities.',
    },
    {
      icon: Clock,
      step: '02',
      title: 'We monitor 24/7',
      description:
        'Our system fetches official policy pages and government websites every 6 hours. When content changes, AI generates a plain-English summary with the original source cited.',
    },
    {
      icon: Bell,
      step: '03',
      title: 'Get ahead of changes',
      description:
        'Receive urgent alerts the moment a high-priority update is detected, plus a weekly digest every Monday. Every alert links directly to the official source.',
    },
  ]

  return (
    <section id="how-it-works" className="bg-slate-950 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400 mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Policy intelligence on autopilot
          </h2>
          <p className="mt-4 text-slate-400">
            Set it up once. We watch the sources that matter. You get notified when
            something changes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map(({ icon: Icon, step, title, description }) => (
            <div key={step} className="relative group flex flex-col items-center text-center md:items-start md:text-left">
              <div className="relative mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Icon size={24} className="text-blue-400" />
                </div>
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {step}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// WHAT WE MONITOR
// ─────────────────────────────────────────────
function WhatWeMonitor() {
  const sources = [
    {
      category: 'E-commerce Platforms',
      color: 'blue',
      items: [
        'Amazon Seller Central — seller policies, fee changes, program updates',
        'Shopify — terms of service, acceptable use, merchant policies',
        'TikTok Shop — US seller policies and program requirements',
      ],
    },
    {
      category: 'Federal Tax',
      color: 'indigo',
      items: [
        'IRS — online seller tax guidance and e-commerce rules',
        'IRS — federal filing deadlines and tax calendar updates',
      ],
    },
    {
      category: 'State Sales Tax',
      color: 'violet',
      items: [
        'CA, TX, NY, FL, WA, IL, PA, OH, GA, MI',
        'NC, AZ, CO, NV, TN — and growing',
        'Filing deadlines, rate changes, new nexus rules',
      ],
    },
  ]

  const colorMap: Record<string, string> = {
    blue: 'border-blue-500/20 bg-blue-500/5',
    indigo: 'border-indigo-500/20 bg-indigo-500/5',
    violet: 'border-violet-500/20 bg-violet-500/5',
  }

  const dotMap: Record<string, string> = {
    blue: 'bg-blue-400',
    indigo: 'bg-indigo-400',
    violet: 'bg-violet-400',
  }

  return (
    <section className="bg-slate-900/30 border-y border-slate-800 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400 mb-3">
            Coverage
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            What we monitor for you
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sources.map(({ category, color, items }) => (
            <div
              key={category}
              className={`rounded-xl border p-6 ${colorMap[color]}`}
            >
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-400">
                    <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dotMap[color]}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// PRICING
// ─────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      name: 'Single Platform',
      price: '$49',
      description: 'Monitor one e-commerce platform — Amazon, Shopify, or TikTok Shop.',
      features: [
        '1 platform monitored',
        'Instant email alerts',
        'Weekly digest every Monday',
        'Urgency tagging (4 levels)',
        'Direct links to official sources',
        'AI plain-English summaries',
        '14-day free trial',
      ],
      cta: 'Start free trial',
      popular: false,
    },
    {
      name: 'Multi-Platform + Federal',
      price: '$99',
      description: 'All 3 platforms plus IRS federal tax guidance and deadlines.',
      features: [
        'All 3 platforms monitored',
        'IRS federal tax updates',
        'Filing deadline reminders (14-day + 3-day)',
        'Instant email alerts',
        'Weekly digest every Monday',
        'Urgency tagging (4 levels)',
        'Priority support',
        '14-day free trial',
      ],
      cta: 'Start free trial',
      popular: true,
    },
    {
      name: 'Full Coverage',
      price: '$149',
      description: 'All platforms, federal, and multi-state sales tax monitoring.',
      features: [
        'All 3 platforms monitored',
        'IRS federal tax updates',
        'Multi-state sales tax (all 15 states)',
        'Filing deadline reminders (14-day + 3-day)',
        'Instant email alerts',
        'Weekly digest every Monday',
        'Urgency tagging (4 levels)',
        'Priority support',
        'Early access to new features',
        '14-day free trial',
      ],
      cta: 'Start free trial',
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="bg-slate-950 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400 mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-slate-400">
            Start free for 14 days. No credit card. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col gap-6 ${
                plan.popular
                  ? 'bg-blue-600 border border-blue-500 shadow-2xl shadow-blue-600/30 scale-[1.02]'
                  : 'bg-slate-900 border border-slate-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-white px-4 py-1 text-xs font-bold text-blue-700 shadow-lg">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className={`mb-1 text-sm ${plan.popular ? 'text-blue-200' : 'text-slate-400'}`}>
                    /month
                  </span>
                </div>
                <p className={`mt-2 text-sm ${plan.popular ? 'text-blue-100' : 'text-slate-400'}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check
                      size={16}
                      className={`mt-0.5 shrink-0 ${plan.popular ? 'text-blue-200' : 'text-blue-400'}`}
                    />
                    <span className={plan.popular ? 'text-blue-50' : 'text-slate-300'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full font-semibold ${
                  plan.popular
                    ? 'bg-white text-blue-700 hover:bg-blue-50'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                <Link href="/signup">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          All plans include a 14-day free trial. No credit card required to start.
        </p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────
function FAQ() {
  const faqs = [
    {
      q: 'What exactly does this platform do?',
      a: 'We monitor publicly available official sources — Amazon Seller Central, Shopify policies, TikTok Shop rules, IRS guidance pages, and state tax authority websites — and alert you when their content changes. Our AI generates plain-English summaries of what changed, always citing the official source URL and publication date.',
    },
    {
      q: 'Does this give me tax or legal advice?',
      a: 'No. This platform provides informational summaries of publicly available updates only. It does not provide legal, tax, or compliance advice, and does not create any advisory relationship. You are responsible for verifying all information directly with official sources and consulting qualified professionals before taking action.',
    },
    {
      q: 'How do deadline reminders work?',
      a: "When our system detects an update that includes a filing deadline, we tag it as deadline-based and schedule reminder emails at 14 days and 3 days before the deadline. According to information available at the time of detection, the deadline date is included — but always verify directly with the official source, as dates may change.",
    },
    {
      q: 'How quickly will I know about a change?',
      a: 'Our scraper runs every 6 hours. When a high-urgency change is detected and confirmed relevant, an email alert is sent immediately. For lower-urgency updates, changes are included in your weekly Monday digest.',
    },
    {
      q: 'What states do you cover for sales tax?',
      a: 'We currently monitor 15 states: CA, TX, NY, FL, WA, IL, PA, OH, GA, MI, NC, AZ, CO, NV, and TN. We are actively expanding coverage. Feature requests for additional states are welcome.',
    },
  ]

  return (
    <section className="bg-slate-900/30 border-t border-slate-800 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400 mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Common questions
          </h2>
        </div>

        <div className="divide-y divide-slate-800">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group py-6">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-white font-medium list-none">
                {q}
                <ChevronDown
                  size={18}
                  className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="mt-4 text-slate-400 text-sm leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// LEGAL POSITIONING SECTION
// ─────────────────────────────────────────────
function LegalPositioning() {
  const isItems = [
    'An automated monitoring and alerting tool',
    'A source of plain-English summaries of official public updates',
    'A deadline tracking and reminder service',
    'An informational intelligence platform',
  ]

  const isNotItems = [
    'A legal advisor or law firm',
    'A tax advisor or CPA service',
    'A compliance certification service',
    'A filing service or regulatory consultant',
    'A replacement for qualified professionals',
  ]

  return (
    <section className="bg-slate-950 py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400 mb-3">
            Important
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            What this platform is — and isn&apos;t
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6">
            <h3 className="font-semibold text-green-400 mb-4 flex items-center gap-2">
              <Check size={16} /> This platform IS
            </h3>
            <ul className="space-y-3">
              {isItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                  <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <h3 className="font-semibold text-red-400 mb-4 flex items-center gap-2">
              <FileText size={16} /> This platform IS NOT
            </h3>
            <ul className="space-y-3">
              {isNotItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 shrink-0 text-red-500 font-bold text-xs">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mandatory disclaimer */}
        <div className="mt-8 flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-5 py-4">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-400/70" />
          <p className="text-sm text-amber-200/70 leading-relaxed">{PLATFORM_DISCLAIMER}</p>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// FINAL CTA BANNER
// ─────────────────────────────────────────────
function CTABanner() {
  return (
    <section className="bg-slate-950 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-8 py-14 text-center shadow-2xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Stop finding out about changes the hard way.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-blue-100 text-lg">
              Start your 14-day free trial. No credit card. No risk. Cancel anytime.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-white text-blue-700 hover:bg-blue-50 font-bold px-10 h-12 text-base shadow-xl"
            >
              <Link href="/signup">Get started free →</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="bg-slate-950">
      <Nav />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <WhatWeMonitor />
      <Pricing />
      <LegalPositioning />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  )
}
