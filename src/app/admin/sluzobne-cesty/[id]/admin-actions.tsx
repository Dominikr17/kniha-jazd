'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Check, X, CreditCard, FileDown, Loader2 } from 'lucide-react'
import type { BusinessTripStatus } from '@/types'
import { generateBusinessTripPDF } from '@/lib/business-trip-pdf'

interface AdminActionsProps {
  tripId: string
  status: BusinessTripStatus
  tripNumber: string
  driverName: string
  driverPosition: string | null
}

export default function AdminActions({
  tripId, status, tripNumber, driverName, driverPosition,
}: AdminActionsProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const res = await fetch(`/api/business-trips/${tripId}/approve`, { method: 'POST' })
      if (res.ok) {
        toast.success(`Služobná cesta ${tripNumber} bola schválená`)
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba pri schvaľovaní')
      }
    } catch {
      toast.error('Chyba pri schvaľovaní')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    try {
      const res = await fetch(`/api/business-trips/${tripId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (res.ok) {
        toast.success(`Služobná cesta ${tripNumber} bola vrátená`)
        setRejectDialogOpen(false)
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba pri vrátení')
      }
    } catch {
      toast.error('Chyba pri vrátení')
    } finally {
      setIsRejecting(false)
    }
  }

  const handleMarkPaid = async () => {
    setIsPaying(true)
    try {
      const res = await fetch(`/api/business-trips/${tripId}/mark-paid`, { method: 'POST' })
      if (res.ok) {
        toast.success(`Služobná cesta ${tripNumber} bola preplatená`)
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba pri preplatení')
      }
    } catch {
      toast.error('Chyba pri preplatení')
    } finally {
      setIsPaying(false)
    }
  }

  const handlePDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const res = await fetch(`/api/business-trips/${tripId}`)
      const data = await res.json()

      await generateBusinessTripPDF({
        trip: data,
        driverName,
        driverPosition,
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
      {status === 'submitted' && (
        <>
          <Button onClick={handleApprove} disabled={isApproving} className="bg-green-600 hover:bg-green-700">
            {isApproving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            Schváliť
          </Button>

          <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <X className="h-4 w-4 mr-2" />
                Vrátiť
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vrátiť služobnú cestu</DialogTitle>
                <DialogDescription>
                  Služobná cesta {tripNumber} bude vrátená vodičovi na opravu.
                </DialogDescription>
              </DialogHeader>
              <div>
                <Label htmlFor="reason">Dôvod vrátenia</Label>
                <Input
                  id="reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Zadajte dôvod vrátenia..."
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                  Zrušiť
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>
                  {isRejecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Vrátiť
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {status === 'approved' && (
        <Button onClick={handleMarkPaid} disabled={isPaying}>
          {isPaying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
          Preplatiť
        </Button>
      )}

      <Button variant="outline" onClick={handlePDF} disabled={isGeneratingPDF}>
        {isGeneratingPDF ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
        Stiahnuť PDF
      </Button>
    </div>
  )
}
