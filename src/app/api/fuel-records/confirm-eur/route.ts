import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit-logger'
import { FUEL_COUNTRIES, FuelCountry } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Overenie autentifikácie admina
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { fuelRecordId, eurTotalPrice, exchangeRate } = body

    // Validácia vstupu
    if (!fuelRecordId || typeof fuelRecordId !== 'string') {
      return NextResponse.json({ error: 'Missing fuelRecordId' }, { status: 400 })
    }

    if (!eurTotalPrice || typeof eurTotalPrice !== 'number' || eurTotalPrice <= 0) {
      return NextResponse.json({ error: 'Invalid eurTotalPrice' }, { status: 400 })
    }

    // Načítanie záznamu
    const { data: record, error: fetchError } = await supabase
      .from('fuel_records')
      .select('*')
      .eq('id', fuelRecordId)
      .single()

    if (fetchError || !record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Kontrola či záznam ešte nie je potvrdený
    if (record.eur_confirmed) {
      return NextResponse.json({ error: 'Record already confirmed' }, { status: 400 })
    }

    // Výpočet EUR ceny za liter a ceny bez DPH
    const eurPricePerLiter = eurTotalPrice / record.liters
    const vatRate = FUEL_COUNTRIES[record.country as FuelCountry]?.vatRate || 0.20
    const eurPriceWithoutVat = eurTotalPrice / (1 + vatRate)

    // Validácia kurzu (ak je zadaný)
    const validatedExchangeRate = exchangeRate && typeof exchangeRate === 'number' && exchangeRate > 0
      ? exchangeRate
      : null

    // Aktualizácia záznamu
    const { error: updateError } = await supabase
      .from('fuel_records')
      .update({
        total_price: eurTotalPrice,
        price_per_liter: eurPricePerLiter,
        price_without_vat: eurPriceWithoutVat,
        eur_confirmed: true,
        eur_confirmed_at: new Date().toISOString(),
        eur_confirmed_by: user.id,
        exchange_rate: validatedExchangeRate,
      })
      .eq('id', fuelRecordId)

    if (updateError) {
      console.error('Error updating fuel record:', updateError)
      return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
    }

    // Audit log
    await logAudit({
      tableName: 'fuel_records',
      recordId: fuelRecordId,
      operation: 'UPDATE',
      userType: 'admin',
      userId: user.id,
      userName: user.email,
      oldData: {
        total_price: record.total_price,
        price_per_liter: record.price_per_liter,
        price_without_vat: record.price_without_vat,
        eur_confirmed: record.eur_confirmed,
      },
      newData: {
        total_price: eurTotalPrice,
        price_per_liter: eurPricePerLiter,
        price_without_vat: eurPriceWithoutVat,
        eur_confirmed: true,
        exchange_rate: validatedExchangeRate,
      },
      description: `${user.email} potvrdil EUR sumu ${eurTotalPrice.toFixed(2)} EUR pre tankovanie`,
    })

    return NextResponse.json({
      success: true,
      data: {
        eurTotalPrice,
        eurPricePerLiter,
        eurPriceWithoutVat,
        exchangeRate: validatedExchangeRate,
      },
    })
  } catch (error) {
    console.error('Error confirming EUR:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
