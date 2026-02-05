'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Send, FileDown, Loader2, Pencil } from 'lucide-react'
import Link from 'next/link'
import type { BusinessTripStatus } from '@/types'
import { generateBusinessTripPDF } from '@/lib/business-trip-pdf'

interface BusinessTripActionsProps {
  tripId: string
  status: BusinessTripStatus
  driverId: string
  driverName: string
  tripData: Record<string, unknown>
}

export default function BusinessTripActions({
  tripId, status, driverId, driverName, tripData,
}: BusinessTripActionsProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/business-trips/${tripId}/submit`, {
        method: 'POST',
      })
      if (res.ok) {
        toast.success('Služobná cesta bola odoslaná na schválenie')
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba pri odosielaní')
      }
    } catch {
      toast.error('Chyba pri odosielaní')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const res = await fetch(`/api/business-trips/${tripId}`)
      const data = await res.json()

      const driver = data.driver || {}
      const driverFullName = `${driver.last_name || ''} ${driver.first_name || ''}`.trim() || driverName

      await generateBusinessTripPDF({
        trip: data,
        driverName: driverFullName,
        driverPosition: driver.position || null,
        borderCrossings: data.border_crossings || [],
        allowances: data.trip_allowances || [],
        expenses: data.trip_expenses || [],
        linkedTrips: (data.business_trip_trips || []).map((btt: { trip: unknown }) => btt.trip).filter(Boolean),
      })

      toast.success('PDF bolo vygenerované')
    } catch {
      toast.error('Chyba pri generovaní PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {(status === 'draft' || status === 'rejected') && (
        <>
          <Button variant="outline" asChild>
            <Link href={`/vodic/sluzobne-cesty/${tripId}/upravit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Upraviť
            </Link>
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Odoslať na schválenie
          </Button>
        </>
      )}

      <Button variant="outline" onClick={handlePDF} disabled={isGeneratingPDF}>
        {isGeneratingPDF ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
        Stiahnuť PDF
      </Button>
    </div>
  )
}
