import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Deadline<span className="text-blue-400">IQ</span>
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Policy &amp; Tax Deadline Intelligence
            </p>
          </Link>
        </div>

        {children}
      </div>
    </div>
  )
}
