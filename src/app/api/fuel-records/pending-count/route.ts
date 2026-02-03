import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('fuel_records')
    .select('*', { count: 'exact', head: true })
    .eq('eur_confirmed', false)

  if (error) {
    return NextResponse.json({ count: 0 })
  }

  return NextResponse.json({ count: count || 0 })
}
