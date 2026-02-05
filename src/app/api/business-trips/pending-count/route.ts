import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('business_trips')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'submitted')

  if (error) {
    return NextResponse.json({ count: 0 })
  }

  return NextResponse.json({ count: count || 0 })
}
