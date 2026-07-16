import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service-role client — this route is admin-only (no user RLS needed)
function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') ?? 'all'
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '50'), 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0'), 0)

  let db: ReturnType<typeof getDb>
  try {
    db = getDb()
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const result: Record<string, unknown> = {}

  if (category === 'all' || category === 'business') {
    const { data, error, count } = await db
      .from('wealth_businesses')
      .select('*', { count: 'exact' })
      .order('first_seen_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result.businesses = data ?? []
    result.businesses_total = count ?? 0
  }

  if (category === 'all' || category === 'capital') {
    const { data, error, count } = await db
      .from('wealth_capital_opportunities')
      .select('*', { count: 'exact' })
      .order('first_seen_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result.capital = data ?? []
    result.capital_total = count ?? 0
  }

  if (category === 'all' || category === 'job') {
    const { data, error, count } = await db
      .from('wealth_jobs')
      .select('*', { count: 'exact' })
      .order('salary_max_cents', { ascending: false, nullsFirst: false })
      .order('first_seen_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result.jobs = data ?? []
    result.jobs_total = count ?? 0
  }

  return NextResponse.json(result)
}
