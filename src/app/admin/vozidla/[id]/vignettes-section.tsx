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
import { Plus, Trash2, Loader2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { VehicleVignette, VIGNETTE_COUNTRIES } from '@/types'
import { logAudit } from '@/lib/audit-logger'
import { format, differenceInDays, parseISO } from 'date-fns'
import { sk } from 'date-fns/locale'

interface VignettesSectionProps {
  vehicleId: string
  vignettes: VehicleVignette[]
}

const VIGNETTE_TYPES = {
  rocna: 'Ročná',
  mesacna: 'Mesačná',
  '10dnovka': '10-dňová',
  ina: 'Iná',
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

export function VignettesSection({ vehicleId, vignettes }: VignettesSectionProps) {
  const [open, setOpen] = useState(false)
  const [country, setCountry] = useState<string>('SK')
  const [vignetteType, setVignetteType] = useState<string>('rocna')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [price, setPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const vignetteData = {
      vehicle_id: vehicleId,
      country,
      vignette_type: vignetteType,
      valid_from: validFrom,
      valid_until: validUntil,
      price: price ? parseFloat(price) : null,
    }

    const { data, error } = await supabase.from('vehicle_vignettes').insert(vignetteData).select().single()

    if (error) {
      toast.error('Nepodarilo sa pridať diaľničnú známku')
      setIsSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    await logAudit({
      tableName: 'vehicle_vignettes',
      recordId: data.id,
      operation: 'INSERT',
      userType: 'admin',
      userId: user?.id,
      userName: user?.email,
      newData: vignetteData,
    })

    toast.success('Diaľničná známka bola pridaná')
    setOpen(false)
    setValidFrom('')
    setValidUntil('')
    setPrice('')
    setIsSubmitting(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)

    const { data: oldData } = await supabase.from('vehicle_vignettes').select('*').eq('id', id).single()
    const { error } = await supabase.from('vehicle_vignettes').delete().eq('id', id)

    if (error) {
      toast.error('Nepodarilo sa vymazať diaľničnú známku')
      setDeletingId(null)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    await logAudit({
      tableName: 'vehicle_vignettes',
      recordId: id,
      operation: 'DELETE',
      userType: 'admin',
      userId: user?.id,
      userName: user?.email,
      oldData,
    })

    toast.success('Diaľničná známka bola vymazaná')
    setDeletingId(null)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Diaľničné známky
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Pridať známku
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pridať diaľničnú známku</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="country">Krajina *</Label>
                  <Select value={country} onValueChange={setCountry} disabled={isSubmitting}>
                    <SelectTrigger id="country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VIGNETTE_COUNTRIES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vignetteType">Typ známky *</Label>
                  <Select
                    value={vignetteType}
                    onValueChange={setVignetteType}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="vignetteType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VIGNETTE_TYPES).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Platnosť od *</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Cena (EUR)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="50.00"
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
        {vignettes.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Zatiaľ neboli pridané žiadne diaľničné známky.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Krajina</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead className="hidden sm:table-cell">Platnosť od</TableHead>
                  <TableHead>Platnosť do</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vignettes.map((vignette) => (
                  <TableRow key={vignette.id}>
                    <TableCell className="font-medium">
                      {VIGNETTE_COUNTRIES[vignette.country as keyof typeof VIGNETTE_COUNTRIES]}
                    </TableCell>
                    <TableCell>
                      {VIGNETTE_TYPES[vignette.vignette_type as keyof typeof VIGNETTE_TYPES]}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {format(parseISO(vignette.valid_from), 'd.M.yyyy', { locale: sk })}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(vignette.valid_until), 'd.M.yyyy', { locale: sk })}
                    </TableCell>
                    <TableCell>{getStatusBadge(vignette.valid_until)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(vignette.id)}
                        disabled={deletingId === vignette.id}
                      >
                        {deletingId === vignette.id ? (
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
