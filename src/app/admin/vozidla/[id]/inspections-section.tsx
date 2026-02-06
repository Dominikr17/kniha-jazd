'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { VehicleInspection } from '@/types'
import { logAudit } from '@/lib/audit-logger'
import { format, differenceInDays, parseISO } from 'date-fns'
import { sk } from 'date-fns/locale'

interface InspectionsSectionProps {
  vehicleId: string
  inspections: VehicleInspection[]
}

function getStatusBadge(validUntil: string) {
  const daysLeft = differenceInDays(parseISO(validUntil), new Date())

  if (daysLeft < 0) {
    return <Badge variant="destructive">Vypršaná</Badge>
  }
  if (daysLeft <= 7) {
    return <Badge variant="destructive">Expiruje o {daysLeft} dní</Badge>
  }
  if (daysLeft <= 30) {
    return <Badge className="bg-orange-500">Expiruje o {daysLeft} dní</Badge>
  }
  return <Badge className="bg-green-500">Platná</Badge>
}

export function InspectionsSection({ vehicleId, inspections }: InspectionsSectionProps) {
  const [open, setOpen] = useState(false)
  const [inspectionType, setInspectionType] = useState<'stk' | 'ek'>('stk')
  const [inspectionDate, setInspectionDate] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const inspectionData = {
      vehicle_id: vehicleId,
      inspection_type: inspectionType,
      inspection_date: inspectionDate,
      valid_until: validUntil,
    }

    const { data, error } = await supabase.from('vehicle_inspections').insert(inspectionData).select().single()

    if (error) {
      toast.error('Nepodarilo sa pridať kontrolu')
      setIsSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    await logAudit({
      tableName: 'vehicle_inspections',
      recordId: data.id,
      operation: 'INSERT',
      userType: 'admin',
      userId: user?.id,
      userName: user?.email,
      newData: inspectionData,
    })

    toast.success('Kontrola bola pridaná')
    setOpen(false)
    setInspectionDate('')
    setValidUntil('')
    setIsSubmitting(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)

    const { data: oldData } = await supabase.from('vehicle_inspections').select('*').eq('id', id).single()
    const { error } = await supabase.from('vehicle_inspections').delete().eq('id', id)

    if (error) {
      toast.error('Nepodarilo sa vymazať kontrolu')
      setDeletingId(null)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    await logAudit({
      tableName: 'vehicle_inspections',
      recordId: id,
      operation: 'DELETE',
      userType: 'admin',
      userId: user?.id,
      userName: user?.email,
      oldData,
    })

    toast.success('Kontrola bola vymazaná')
    setDeletingId(null)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          STK / EK kontroly
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Pridať kontrolu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pridať STK/EK kontrolu</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inspectionType">Typ kontroly *</Label>
                <Select
                  value={inspectionType}
                  onValueChange={(v) => setInspectionType(v as 'stk' | 'ek')}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="inspectionType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stk">STK (technická kontrola)</SelectItem>
                    <SelectItem value="ek">EK (emisná kontrola)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inspectionDate">Dátum kontroly *</Label>
                <Input
                  id="inspectionDate"
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Platnosť do *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  required
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
        {inspections.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Zatiaľ neboli pridané žiadne kontroly.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Typ</TableHead>
                <TableHead>Dátum kontroly</TableHead>
                <TableHead>Platnosť do</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((inspection) => (
                <TableRow key={inspection.id}>
                  <TableCell className="font-medium">
                    {inspection.inspection_type.toUpperCase()}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(inspection.inspection_date), 'd.M.yyyy', { locale: sk })}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(inspection.valid_until), 'd.M.yyyy', { locale: sk })}
                  </TableCell>
                  <TableCell>{getStatusBadge(inspection.valid_until)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(inspection.id)}
                      disabled={deletingId === inspection.id}
                      aria-label="Vymazať kontrolu"
                    >
                      {deletingId === inspection.id ? (
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
