import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/report-utils'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Neplatné ID' }, { status: 400 })
    }

    const supabase = await createClient()

    // Načítať SC s detailmi pre PDF generovanie na klientovi
    const { data: trip, error } = await supabase
      .from('business_trips')
      .select(`
        *,
        driver:drivers(*),
        border_crossings(*),
        trip_allowances(*),
        trip_expenses(*),
        business_trip_trips(*, trip:trips(*, vehicle:vehicles(*)))
      `)
      .eq('id', id)
      .single()

    if (error || !trip) {
      return NextResponse.json({ error: 'Služobná cesta nenájdená' }, { status: 404 })
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error('Error getting business trip PDF data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
