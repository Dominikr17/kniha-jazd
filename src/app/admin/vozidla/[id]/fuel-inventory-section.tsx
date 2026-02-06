'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Loader2, Fuel } from 'lucide-react'
import { toast } from 'sonner'
import { FuelInventory } from '@/types'
import { logAudit } from '@/lib/audit-logger'
import { format, parseISO } from 'date-fns'
import { sk } from 'date-fns/locale'

interface FuelInventorySectionProps {
  vehicleId: string
  fuelInventory: FuelInventory[]
  tankCapacity: number | null
}

const SOURCE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  initial: { label: 'Počiatočný stav', variant: 'default' },
  full_tank: { label: 'Plná nádrž', variant: 'secondary' },
  manual_correction: { label: 'Manuálna korekcia', variant: 'outline' },
}

export function FuelInventorySection({ vehicleId, fuelInventory, tankCapacity }: FuelInventorySectionProps) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('')
  const [fuelAmount, setFuelAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const amount = parseFloat(fuelAmount)
    if (isNaN(amount) || amount < 0) {
      toast.error('Neplatné množstvo paliva')
      setIsSubmitting(false)
      return
    }

    if (tankCapacity && amount > tankCapacity) {
      toast.error(`Množstvo prevyšuje kapacitu nádrže (${tankCapacity} l)`)
      setIsSubmitting(false)
      return
    }

    const response = await fetch('/api/fuel-inventory/initial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId,
        date,
        fuelAmount: amount,
        notes: notes || null,
      }),
    })

    const result = await response.json()

    if (!result.success) {
      toast.error(result.error || 'Nepodarilo sa pridať záznam')
      setIsSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    await logAudit({
      tableName: 'fuel_inventory',
      recordId: result.data.id,
      operation: 'INSERT',
      userType: 'admin',
      userId: user?.id,
      userName: user?.email,
      newData: { vehicleId, date, fuelAmount: amount, notes },
    })

    toast.success('Počiatočný stav bol pridaný')
    setOpen(false)
    setDate('')
    setFuelAmount('')
    setNotes('')
    setIsSubmitting(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)

    const { data: oldData } = await supabase.from('fuel_inventory').select('*').eq('id', id).single()
    const { error } = await supabase.from('fuel_inventory').delete().eq('id', id)

    if (error) {
      toast.error('Nepodarilo sa vymazať záznam')
      setDeletingId(null)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    await logAudit({
      tableName: 'fuel_inventory',
      recordId: id,
      operation: 'DELETE',
      userType: 'admin',
      userId: user?.id,
      userName: user?.email,
      oldData,
    })

    toast.success('Záznam bol vymazaný')
    setDeletingId(null)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5" />
          Palivové zásoby
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Pridať počiatočný stav
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pridať počiatočný stav nádrže</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Dátum *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuelAmount">
                  Množstvo paliva (litre) *
                  {tankCapacity && (
                    <span className="text-muted-foreground ml-2 font-normal">
                      max. {tankCapacity} l
                    </span>
                  )}
                </Label>
                <Input
                  id="fuelAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={tankCapacity || undefined}
                  value={fuelAmount}
                  onChange={(e) => setFuelAmount(e.target.value)}
                  placeholder="napr. 25.5"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Poznámka</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Voliteľná poznámka..."
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ukladám...
                    </>
                  ) : (
                    'Uložiť'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  Zrušiť
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Referenčné body umožňujú automatický výpočet stavu nádrže pre mesačné výkazy PHM.
          Pridajte počiatočný stav nádrže alebo využite tankovanie &quot;do plna&quot;.
        </p>
        {fuelInventory.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Zatiaľ neboli pridané žiadne referenčné body.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dátum</TableHead>
                <TableHead>Množstvo</TableHead>
                <TableHead>Zdroj</TableHead>
                <TableHead>Poznámka</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fuelInventory.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(parseISO(record.date), 'd.M.yyyy', { locale: sk })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {record.fuel_amount.toFixed(2)} l
                  </TableCell>
                  <TableCell>
                    <Badge variant={SOURCE_LABELS[record.source]?.variant || 'outline'}>
                      {SOURCE_LABELS[record.source]?.label || record.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(record.id)}
                      disabled={deletingId === record.id}
                      aria-label="Vymazať záznam"
                    >
                      {deletingId === record.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
