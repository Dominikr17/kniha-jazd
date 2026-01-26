'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteVehicleButtonProps {
  id: string
  name: string
}

export function DeleteVehicleButton({ id, name }: DeleteVehicleButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setIsDeleting(true)

    const { error } = await supabase.from('vehicles').delete().eq('id', id)

    if (error) {
      toast.error('Nepodarilo sa vymazať vozidlo')
      setIsDeleting(false)
      return
    }

    toast.success('Vozidlo bolo vymazané')
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vymazať vozidlo</DialogTitle>
          <DialogDescription>
            Naozaj chcete vymazať vozidlo <strong>{name}</strong>? Vymažú sa aj všetky súvisiace dokumenty, kontroly a diaľničné známky. Táto akcia sa nedá vrátiť späť.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Zrušiť
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mazanie...
              </>
            ) : (
              'Vymazať'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
