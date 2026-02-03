'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

interface DeleteReportButtonProps {
  reportId: string
  vehicleName: string
  month: string
  year: number
}

export function DeleteReportButton({ reportId, vehicleName, month, year }: DeleteReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/vykazy/${reportId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.redirected) {
        toast.success('Výkaz bol vymazaný')
        router.push('/admin/vykazy')
        return
      }

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Chyba pri mazaní výkazu')
        setIsDeleting(false)
        return
      }

      toast.success('Výkaz bol vymazaný')
      router.push('/admin/vykazy')
    } catch {
      toast.error('Chyba pri mazaní výkazu')
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Vymazať
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vymazať mesačný výkaz?</DialogTitle>
          <DialogDescription>
            Naozaj chcete vymazať mesačný výkaz pre vozidlo {vehicleName} za {month} {year}?
            Táto akcia je nevratná.
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
