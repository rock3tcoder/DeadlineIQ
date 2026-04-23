import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch opportunities — newest first, best grades first
  const { data: opportunities, error: oppError } = await supabase
    .from('wealth_opportunities')
    .select('*')
    .neq('status', 'passed')
    .order('found_at', { ascending: false })
    .limit(200)

  if (oppError) {
    return NextResponse.json({ error: oppError.message }, { status: 500 })
  }

  // Fetch outreach drafts
  const { data: outreach, error: outreachError } = await supabase
    .from('wealth_outreach')
    .select('*')
    .is('sent_at', null)
    .order('created_at', { ascending: true })

  if (outreachError) {
    return NextResponse.json({ error: outreachError.message }, { status: 500 })
  }

  return NextResponse.json({
    opportunities: opportunities ?? [],
    outreach: outreach ?? [],
  })
}
