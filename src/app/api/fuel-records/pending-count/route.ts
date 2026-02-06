import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Overenie admin autentifikácie
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ count: 0 }, { status: 401 })
    }

    const { count, error } = await supabase
      .from('fuel_records')
      .select('*', { count: 'exact', head: true })
      .eq('eur_confirmed', false)

    if (error) {
      console.error('Error getting pending fuel records count:', error)
      return NextResponse.json({ count: 0 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error('Error in pending fuel records count:', error)
    return NextResponse.json({ count: 0 }, { status: 500 })
  }
}
